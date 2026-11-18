import "server-only";
import { buildArchitectureMap } from "@/lib/github/architecture";

export type PublicRepositoryInput = { owner: string; repo: string };

const segment = /^[A-Za-z0-9_.-]{1,100}$/;

export function parsePublicRepository(value: unknown): PublicRepositoryInput | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.owner !== "string" || typeof candidate.repo !== "string") return null;
  const owner = candidate.owner.trim();
  const repo = candidate.repo.trim().replace(/\.git$/i, "");
  if (!segment.test(owner) || !segment.test(repo) || owner === "." || owner === ".." || repo === "." || repo === "..") return null;
  return { owner, repo };
}

type GitHubRepo = {
  name: string; full_name: string; html_url: string; description: string | null;
  private: boolean; fork: boolean; archived: boolean; default_branch: string;
  stargazers_count: number; forks_count: number; open_issues_count: number;
  language: string | null; topics?: string[]; created_at: string; updated_at: string;
};

type GitHubContent = { name: string; path: string; type: string; size: number; html_url: string };

async function githubGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "APEX-Repository-Intelligence" },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  if (response.status === 404) throw new Error("REPOSITORY_NOT_FOUND");
  if (response.status === 403 || response.status === 429) throw new Error("GITHUB_RATE_LIMITED");
  if (!response.ok) throw new Error("GITHUB_REQUEST_FAILED");
  return response.json() as Promise<T>;
}

export async function inspectPublicRepository(input: PublicRepositoryInput) {
  const base = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}`;
  const repository = await githubGet<GitHubRepo>(base);
  if (repository.private) throw new Error("PUBLIC_REPOSITORIES_ONLY");
  const [contents, languages] = await Promise.all([
    githubGet<GitHubContent[]>(`${base}/contents`),
    githubGet<Record<string, number>>(`${base}/languages`),
  ]);
  const rootFiles = contents.slice(0, 100).map((item) => ({
    name: item.name, path: item.path, type: item.type, size: item.size,
    url: item.html_url,
  }));
  const extensions = rootFiles.filter((item) => item.type === "file").map((item) => item.name.split(".").pop()?.toLowerCase()).filter(Boolean);
  const configFiles = ["package.json", "pyproject.toml", "requirements.txt", "Cargo.toml", "go.mod", "pom.xml", "build.gradle", "Dockerfile", "docker-compose.yml", "compose.yaml", "next.config.js", "next.config.ts", "tsconfig.json", ".github"];
  const detectedConfigs = rootFiles.filter((item) => configFiles.includes(item.name)).map((item) => item.name);
  const languageEntries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const totalBytes = languageEntries.reduce((sum, [, bytes]) => sum + bytes, 0);
  return {
    repository: {
      name: repository.name, fullName: repository.full_name, url: repository.html_url,
      description: repository.description, defaultBranch: repository.default_branch,
      stars: repository.stargazers_count, forks: repository.forks_count,
      openIssues: repository.open_issues_count, primaryLanguage: repository.language,
      topics: repository.topics ?? [], isFork: repository.fork, isArchived: repository.archived,
      createdAt: repository.created_at, updatedAt: repository.updated_at,
    },
    languages: languageEntries.map(([name, bytes]) => ({ name, bytes, percentage: totalBytes ? Math.round(bytes / totalBytes * 1000) / 10 : 0 })),
    root: { entries: rootFiles, fileCount: contents.filter((item) => item.type === "file").length, directoryCount: contents.filter((item) => item.type === "dir").length, extensions: [...new Set(extensions)].sort(), detectedConfigs },
    limitations: ["Public repositories only; private repository OAuth access is not configured.", "This is metadata and root-directory inspection, not a full source-code security audit.", "GitHub unauthenticated API rate limits apply.", "No repository contents are stored by APEX."],
  };
}

const SOURCE_EXTENSIONS = new Set(["ts","tsx","js","jsx","mjs","cjs","py","java","go","rs","rb","php","cs","cpp","c","h","hpp","swift","kt","kts","dart","vue","svelte","html","css","scss","json","yaml","yml","toml","md","mdx","sql","sh"]);
const BLOCKED_PATH_PARTS = /(^|\\/)(\.env($|\.)|secrets?($|[._-])|credentials?($|[._-])|private|certificates?($|[._-]))/i;
const BLOCKED_EXTENSIONS = new Set(["pem","key","p12","pfx","crt","cer","der","db","sqlite","lock"]);

export async function listPublicSourceFiles(input: PublicRepositoryInput) {
  const base = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}`;
  const repository = await githubGet<GitHubRepo>(base);
  if (repository.private) throw new Error("PUBLIC_REPOSITORIES_ONLY");
  const tree = await githubGet<{ truncated: boolean; tree: Array<{ path: string; type: string; size?: number; sha: string }> }>(
    `${base}/git/trees/${encodeURIComponent(repository.default_branch)}?recursive=1`
  );
  const files = tree.tree.filter((item) => {
    if (item.type !== "blob" || !item.size || item.size > 64_000) return false;
    if (BLOCKED_PATH_PARTS.test(item.path)) return false;
    const extension = item.path.split(".").pop()?.toLowerCase() ?? "";
    return SOURCE_EXTENSIONS.has(extension) && !BLOCKED_EXTENSIONS.has(extension);
  }).slice(0, 250).map((item) => ({ path: item.path, size: item.size ?? 0, sha: item.sha }));
  return { files, truncated: tree.truncated, limited: files.length === 250, defaultBranch: repository.default_branch };
}

export async function readPublicSourceFile(input: PublicRepositoryInput, pathValue: unknown) {
  if (typeof pathValue !== "string" || pathValue.length < 1 || pathValue.length > 500) throw new Error("INVALID_SOURCE_PATH");
  const path = pathValue.trim();
  if (path.startsWith("/") || path.includes("\\") || path.split("/").some((part) => !part || part === "." || part === "..") || BLOCKED_PATH_PARTS.test(path)) throw new Error("INVALID_SOURCE_PATH");
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  if (!SOURCE_EXTENSIONS.has(extension) || BLOCKED_EXTENSIONS.has(extension)) throw new Error("UNSUPPORTED_SOURCE_FILE");
  const base = `https://api.github.com/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
  const content = await githubGet<{ type: string; size: number; encoding: string; content: string; path: string; html_url: string }>(base);
  if (content.type !== "file" || content.size > 64_000 || content.encoding !== "base64") throw new Error("SOURCE_FILE_TOO_LARGE");
  const decoded = Buffer.from(content.content.replace(/\\s/g, ""), "base64").toString("utf8");
  if (decoded.includes("\\u0000")) throw new Error("UNSUPPORTED_SOURCE_FILE");
  return { path: content.path, size: content.size, url: content.html_url, content: decoded };
}


export async function inspectPublicArchitecture(input: PublicRepositoryInput) {
  const listing = await listPublicSourceFiles(input);
  const preferred = new Set(["ts","tsx","js","jsx","mjs","cjs","py","java","go"]);
  const candidates = listing.files
    .filter((file) => preferred.has(file.path.split(".").pop()?.toLowerCase() ?? "") && file.size <= 32_000)
    .slice(0, 24);
  const files: Array<{ path: string; size: number; content: string }> = [];
  let bytesRead = 0;
  let cursor = 0;
  let byteLimitReached = false;
  async function worker() {
    while (cursor < candidates.length) {
      const current = candidates[cursor++];
      if (bytesRead + current.size > 384_000) { byteLimitReached = true; continue; }
      bytesRead += current.size;
      const source = await readPublicSourceFile(input, current.path);
      files.push({ path: source.path, size: source.size, content: source.content });
    }
  }
  await Promise.all(Array.from({ length: 4 }, () => worker()));
  return buildArchitectureMap(files, {
    sampled: files.length,
    eligible: listing.files.filter((file) => preferred.has(file.path.split(".").pop()?.toLowerCase() ?? "")).length,
    truncated: listing.truncated || listing.limited,
    byteLimitReached,
  });
}

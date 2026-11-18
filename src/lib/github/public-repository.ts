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
  const content = await githubGet<{ type: string; size: number; encoding: string; content: string; path: string; html_url: string; sha: string }>(base);
  if (content.type !== "file" || content.size > 64_000 || content.encoding !== "base64") throw new Error("SOURCE_FILE_TOO_LARGE");
  const decoded = Buffer.from(content.content.replace(/\s/g, ""), "base64").toString("utf8");
  if (decoded.includes("\u0000")) throw new Error("UNSUPPORTED_SOURCE_FILE");
  return { path: content.path, size: content.size, url: content.html_url, sha: content.sha, content: decoded };
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


const TEST_FILE_PATTERN = /(^|\/)(__tests__|tests?|specs?)\/|\.(test|spec)\.[^.]+$/i;
const TEST_MANIFESTS = ["package.json", "pyproject.toml", "pytest.ini", "tox.ini", "requirements.txt", "Cargo.toml", "go.mod", "pom.xml", "build.gradle", "build.gradle.kts", "Gemfile", "composer.json"];

export async function inspectPublicTestIntelligence(input: PublicRepositoryInput) {
  const listing = await listPublicSourceFiles(input);
  const testFiles = listing.files.filter((file) => TEST_FILE_PATTERN.test(file.path) || /(^|\/)(jest|vitest|playwright|cypress|pytest|tox|karma|jasmine)\.[^/]+$/i.test(file.path));
  const manifestPaths = listing.files.filter((file) => TEST_MANIFESTS.includes(file.path.split("/").pop() ?? "") && file.size <= 24_000).slice(0, 8);
  const manifests = await Promise.all(manifestPaths.map(async (file) => {
    try { return await readPublicSourceFile(input, file.path); } catch { return null; }
  }));
  const manifestText = manifests.filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => ({ path: item.path, content: item.content.slice(0, 24_000) }));
  const evidence = new Set<string>();
  const add = (name: string, pattern: RegExp) => { if (pattern.test(manifestText.map((item) => item.content).join("\n"))) evidence.add(name); };
  add("Jest", /\bjest\b|jest\.config/i);
  add("Vitest", /\bvitest\b|vitest\.config/i);
  add("Playwright", /\bplaywright\b|playwright\.config/i);
  add("Cypress", /\bcypress\b|cypress\.config/i);
  add("Mocha", /\bmocha\b/);
  add("pytest", /\bpytest\b/);
  add("unittest", /\bunittest\b/);
  add("Go testing", /\btesting\b/);
  add("Rust test harness", /\[dev-dependencies\]|\bcargo test\b/);
  add("JUnit", /\bjunit\b|org\.junit/);
  add("RSpec", /\brspec\b/);
  add("PHPUnit", /\bphpunit\b/);
  if (testFiles.some((file) => /\.test\.|\.spec\./i.test(file.path))) evidence.add("File naming convention: .test/.spec");
  const frameworks = [...evidence].sort();
  const related = testFiles.map((test) => {
    const name = (test.path.split("/").pop() ?? "").replace(/\.(test|spec)\.[^.]+$/i, "").replace(/\.[^.]+$/, "").toLowerCase();
    return { ...test, basename: name };
  });
  const sourceCandidates = listing.files.filter((file) => !TEST_FILE_PATTERN.test(file.path) && !TEST_MANIFESTS.includes(file.path.split("/").pop() ?? ""));
  const suggestions = sourceCandidates.slice(0, 80).map((source) => {
    const base = (source.path.split("/").pop() ?? "").replace(/\.[^.]+$/, "").toLowerCase();
    const matches = related.filter((test) => test.basename === base || test.basename === base.replace(/\.(component|service|controller|route)$/, "") || test.path.toLowerCase().includes(base + ".test.") || test.path.toLowerCase().includes(base + ".spec."));
    return { sourcePath: source.path, likelyTests: matches.slice(0, 5).map((test) => test.path), confidence: matches.length ? "name-match" as const : "none" as const };
  }).filter((item) => item.likelyTests.length > 0);
  return {
    frameworks,
    testFiles: testFiles.slice(0, 120).map((file) => ({ path: file.path, size: file.size })),
    sourceMappings: suggestions.slice(0, 60),
    manifests: manifestText.map((item) => item.path),
    coverage: { filesListed: listing.files.length, testFilesDetected: testFiles.length, listingTruncated: listing.truncated, listingLimited: listing.limited, mappingsCapped: suggestions.length > 60 },
    limitations: [
      "Framework detection uses manifest text and file names; dependencies or configuration may be unused.",
      "Source-to-test links are filename heuristics, not verified import or coverage relationships.",
      "Only the bounded public source-file listing is inspected; generated, ignored, hidden or unsupported files may be absent.",
      "No repository code, test command or package script is executed. No tests are reported as passing or failing.",
    ],
  };
}


export async function inspectPublicTestQuality(input: PublicRepositoryInput) {
  const listing = await listPublicSourceFiles(input);
  const isTest = (path: string) => TEST_FILE_PATTERN.test(path) || /(^|\/)(jest|vitest|playwright|cypress|pytest|tox|karma|jasmine)\.[^/]+$/i.test(path);
  const detected = listing.files.filter((file) => isTest(file.path));
  const candidates = detected.filter((file) => file.size <= 24_000).slice(0, 30);
  const selected: typeof candidates = [];
  let bytes = 0;
  for (const file of candidates) {
    if (bytes + file.size > 240_000) continue;
    bytes += file.size;
    selected.push(file);
  }
  async function readBatch<T extends { path: string }>(files: T[]) {
    const results: Array<Awaited<ReturnType<typeof readPublicSourceFile>> | null> = new Array(files.length).fill(null);
    let cursor = 0;
    async function worker() {
      while (cursor < files.length) {
        const index = cursor++;
        try { results[index] = await readPublicSourceFile(input, files[index].path); } catch { results[index] = null; }
      }
    }
    await Promise.all(Array.from({ length: Math.min(4, files.length) }, () => worker()));
    return results;
  }
  const contents = await readBatch(selected);
  const scanned = contents.filter((item): item is NonNullable<typeof item> => Boolean(item));
  const corpus = scanned.map((item) => item.content).join("\n");
  const count = (pattern: RegExp) => (corpus.match(pattern) ?? []).length;
  const titles: Array<{ title: string; path: string }> = [];
  for (const file of scanned) {
    const pattern = /\b(?:it|test)\s*\(\s*(['"])([^'"]{1,240})\1/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(file.content)) !== null) titles.push({ title: match[2].trim(), path: file.path });
  }
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const titleCounts = new Map<string, number>();
  for (const item of titles) {
    const key = normalize(item.title);
    if (key) titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  }
  const duplicates = [...titleCounts.entries()].filter((entry) => entry[1] > 1).map((entry) => ({ title: entry[0], occurrences: entry[1] })).slice(0, 30);
  const sourceCandidates = listing.files.filter((file) => !isTest(file.path) && !TEST_MANIFESTS.includes(file.path.split("/").pop() ?? ""));
  const testBases = new Set(selected.map((file) => (file.path.split("/").pop() ?? "").replace(/\.(test|spec)\.[^.]+$/i, "").replace(/\.[^.]+$/, "").toLowerCase()));
  const unmatched = sourceCandidates.slice(0, 100).filter((file) => {
    const base = (file.path.split("/").pop() ?? "").replace(/\.[^.]+$/, "").toLowerCase();
    return !testBases.has(base) && !testBases.has(base.replace(/\.(component|service|controller|route)$/, ""));
  }).slice(0, 40).map((file) => file.path);
  const sourceSample = sourceCandidates.filter((file) => file.size <= 16_000).slice(0, 20);
  const sourceContents = await readBatch(sourceSample);
  const scenarioRules = [
    { name: "Error handling", source: /\b(?:throw|catch|reject|Error)\b/i, test: /\b(?:rejects|toThrow|toThrowError|raises|assertRaises|assertThrows|error|throws)\b/i },
    { name: "Async behaviour", source: /\b(?:async|await|Promise)\b/, test: /\b(?:async|await|resolves|rejects|promise)\b/i },
    { name: "Input validation", source: /\b(?:parse|validate|schema|invalid|required|min|max)\b/i, test: /\b(?:invalid|required|empty|boundary|validation|schema)\b/i },
    { name: "Authorization checks", source: /\b(?:auth|session|permission|forbidden|unauthorized|owner)\b/i, test: /\b(?:unauthorized|forbidden|permission|access denied|authenticated|authorization)\b/i },
  ];
  const scenarioCoverageHints = sourceContents.filter((item): item is NonNullable<typeof item> => Boolean(item)).flatMap((source) => {
    return scenarioRules.filter((rule) => rule.source.test(source.content)).map((rule) => ({
      sourcePath: source.path,
      scenario: rule.name,
      status: rule.test.test(corpus) ? "signal-found" as const : "not-detected" as const,
    }));
  }).slice(0, 60);
  const signals = [
    { name: "Error / rejection assertions", count: count(/\b(?:rejects|toThrow|toThrowError|raises|assertRaises|assertThrows|assert_rejects)\b/g) },
    { name: "Boundary / empty-value signals", count: count(/\b(?:toBeNull|toBeUndefined|toBeFalsy|toBeTruthy|toHaveLength|empty|boundary|edge case)\b/gi) },
    { name: "Async / promise signals", count: count(/\b(?:resolves|rejects|async|await)\b/g) },
    { name: "Authorization / security signals", count: count(/\b(?:unauthorized|forbidden|permission|access denied|csrf|xss|injection|sanitize|escape)\b/gi) },
  ];
  return {
    summary: {
      testFilesDetected: detected.length, testFilesScanned: scanned.length, bytesScanned: bytes,
      testDeclarations: count(/\b(?:it|test)\s*\(/g),
      assertionCalls: count(/\b(?:expect|assert|should|assertThat)\s*\(/g),
      skippedTests: count(/\b(?:it|test|describe)\s*\.\s*(?:skip|todo)\s*\(|\b(?:xit|xdescribe)\s*\(/g),
      focusedTests: count(/\b(?:it|test|describe)\s*\.\s*only\s*\(/g),
      emptyTestBodies: count(/\b(?:it|test)\s*\(\s*['"][^'"]+['"]\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{\s*\}\s*\)/g),
      testTitlesFound: titles.length, duplicateTitleGroups: duplicates.length,
    },
    signals, scenarioCoverageHints, duplicateTitles: duplicates,
    weakTestTitles: titles.filter((item) => /^(test|works|should work|does work|renders|it works|basic test)$/i.test(item.title)).slice(0, 30),
    sourceFilesWithoutFilenameMatch: unmatched,
    coverage: {
      listingTruncated: listing.truncated, listingLimited: listing.limited,
      testFilesCapped: detected.length > candidates.length, sampleCapped: candidates.length >= 30,
      sourceSampleCapped: sourceCandidates.length > 100,
      byteBudgetReached: candidates.some((file) => !selected.some((chosen) => chosen.path === file.path)),
    },
    limitations: [
      "Text-pattern heuristics only; comments, examples, generated files and custom test APIs can distort counts.",
      "Assertion counts are not a measure of correctness, quality or coverage. Duplicate titles may be intentional.",
      "Scenario signals and source-to-test scenario hints count matching words and APIs, not verified test behaviour.",
      "Files without filename matches may still be covered by integration, contract or end-to-end tests.",
      "Only up to 30 test files, 24 KB per file and 240 KB total are scanned; the repository listing itself is bounded.",
      "No tests, scripts or repository code are executed. No runtime coverage data is collected.",
    ],
  };
}

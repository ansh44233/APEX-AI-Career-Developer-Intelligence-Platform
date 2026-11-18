export type ArchitectureFile = { path: string; size: number; content: string };
export type ArchitectureEdge = { from: string; to: string; kind: "relative" | "alias" | "package" };

const IMPORT_PATTERNS = [
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
  /require\s*\(\s*["']([^"']+)["']\s*\)/g,
  /import\s*\(\s*["']([^"']+)["']\s*\)/g,
  /^\s*from\s+([A-Za-z0-9_./]+)\s+import\s+/gm,
];

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".java", ".go"];
function normalizePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.replace(/\\/g, "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

export function buildArchitectureMap(files: ArchitectureFile[], coverage: { sampled: number; eligible: number; truncated: boolean; byteLimitReached: boolean }) {
  const known = new Set(files.map((file) => file.path));
  const edges: ArchitectureEdge[] = [];
  const modules = new Map<string, number>();
  const entrypoints: string[] = [];
  const external = new Map<string, number>();
  for (const file of files) {
    const segments = file.path.split("/");
    const moduleName = segments.length > 1 ? segments[0] : "(root)";
    modules.set(moduleName, (modules.get(moduleName) ?? 0) + 1);
    if (/(^|\/)(index|main|app|server|cli|page|route)\.[^.]+$/i.test(file.path)) entrypoints.push(file.path);
    const specifiers = new Set<string>();
    for (const pattern of IMPORT_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(file.content)) && specifiers.size < 300) specifiers.add(match[1]);
    }
    for (const specifier of specifiers) {
      if (specifier.startsWith(".") || specifier.startsWith("@/")) {
        const base = specifier.startsWith("@/") ? specifier.slice(2) : normalizePath(segments.slice(0, -1).join("/") + "/" + specifier);
        const aliasBases = specifier.startsWith("@/") ? [base, "src/" + base] : [base];
        const candidates = aliasBases.flatMap((candidateBase) => [candidateBase, ...CODE_EXTENSIONS.map((extension) => candidateBase + extension), ...CODE_EXTENSIONS.map((extension) => candidateBase + "/index" + extension)]);
        const resolved = candidates.find((candidate) => known.has(candidate));
        if (resolved) edges.push({ from: file.path, to: resolved, kind: specifier.startsWith("@/") ? "alias" : "relative" });
      } else if (!specifier.startsWith("/") && !specifier.startsWith("#")) {
        const packageName = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
        external.set(packageName, (external.get(packageName) ?? 0) + 1);
        edges.push({ from: file.path, to: packageName, kind: "package" });
      }
    }
  }
  const uniqueEdges = Array.from(new Map(edges.map((edge) => [edge.from + "|" + edge.to + "|" + edge.kind, edge])).values());
  const incoming = new Map<string, number>();
  for (const edge of uniqueEdges) if (edge.kind !== "package") incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  const mostImported = Array.from(incoming, ([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 12);
  return {
    summary: { filesSampled: files.length, internalConnections: uniqueEdges.filter((edge) => edge.kind !== "package").length, externalPackageReferences: uniqueEdges.filter((edge) => edge.kind === "package").length, modules: modules.size },
    files: files.map((file) => ({ path: file.path, size: file.size, imports: uniqueEdges.filter((edge) => edge.from === file.path).length })),
    edges: uniqueEdges.slice(0, 400),
    modules: Array.from(modules, ([name, fileCount]) => ({ name, fileCount })).sort((a, b) => b.fileCount - a.fileCount),
    entrypoints: entrypoints.slice(0, 40),
    mostImported,
    externalPackages: Array.from(external, ([name, references]) => ({ name, references })).sort((a, b) => b.references - a.references).slice(0, 30),
    coverage,
    limitations: [
      "This is a bounded sample of eligible public source files, not a complete repository index.",
      "Import parsing uses language-specific text patterns; dynamic imports, generated paths, complex aliases and many language constructs may be missed.",
      "Only imports resolvable within the sampled file set become internal connections.",
      "Directory groupings are based on each file's first path segment, not inferred architectural boundaries.",
      "No code is executed and no quality, security, ownership or runtime behaviour is inferred.",
    ],
  };
}

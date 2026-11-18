"use client";

import { useState } from "react";
import { ExternalLink, FolderGit2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

type Analysis = {
  repository: { name: string; fullName: string; url: string; description: string | null; defaultBranch: string; stars: number; forks: number; openIssues: number; primaryLanguage: string | null; topics: string[]; isFork: boolean; isArchived: boolean; updatedAt: string };
  languages: Array<{ name: string; bytes: number; percentage: number }>;
  root: { entries: Array<{ name: string; path: string; type: string; size: number; url: string }>; fileCount: number; directoryCount: number; extensions: string[]; detectedConfigs: string[] };
  limitations: string[];
};

export function GitHubRepositoryIntelligence() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourceFiles, setSourceFiles] = useState<Array<{ path: string; size: number; sha: string }>>([]);
  const [sourceFile, setSourceFile] = useState<{ path: string; size: number; url: string; content: string } | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);

  async function inspect() {
    if (!owner.trim() || !repo.trim() || loading) return;
    setLoading(true); setError(""); setAnalysis(null);
    try {
      const response = await fetch("/api/github/public-repository", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: owner.trim(), repo: repo.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Repository inspection failed.");
      setAnalysis(data.analysis);
      const fileResponse = await fetch("/api/github/public-repository", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner: owner.trim(), repo: repo.trim(), action: "list-files" }) });
      const fileData = await fileResponse.json();
      if (fileResponse.ok) setSourceFiles(fileData.sourceFiles?.files ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Repository inspection failed."); }
    finally { setLoading(false); }
  }

  async function previewFile(path: string) {
    if (sourceLoading) return;
    setSourceLoading(true); setError(""); setSourceFile(null);
    try {
      const response = await fetch("/api/github/public-repository", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner: owner.trim(), repo: repo.trim(), action: "read-file", path }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load source file.");
      setSourceFile(data.sourceFile);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load source file."); }
    finally { setSourceLoading(false); }
  }

  return <section className="mt-6 rounded-3xl border border-violet-300/15 bg-[#111119] p-5 sm:p-6">
    <div className="flex items-center gap-2 text-violet-200"><FolderGit2 className="h-4 w-4"/><p className="text-xs font-semibold tracking-[0.16em]">GITHUB INTELLIGENCE · PUBLIC REPOSITORIES</p></div>
    <h2 className="mt-3 text-xl font-semibold">Inspect a GitHub repository</h2>
    <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-400">Enter a public repository owner and name. APEX retrieves repository metadata, language statistics and root-directory entries through GitHub's public API.</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="text-xs text-zinc-400">Owner<input value={owner} onChange={(event) => setOwner(event.target.value)} maxLength={100} placeholder="e.g. vercel" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-violet-400"/></label>
      <label className="text-xs text-zinc-400">Repository<input value={repo} onChange={(event) => setRepo(event.target.value)} maxLength={100} placeholder="e.g. next.js" className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-violet-400"/></label>
      <button onClick={() => void inspect()} disabled={loading || !owner.trim() || !repo.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}Inspect</button>
    </div>
    <p className="mt-3 flex items-center gap-2 text-[10px] text-emerald-200"><ShieldCheck className="h-3.5 w-3.5"/> Read-only · public data only · no repository writes</p>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/15 p-3 text-xs text-rose-200">{error}</p>}
    {analysis && <div className="mt-5 space-y-4">
      <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-white">{analysis.repository.fullName}</p><p className="mt-1 text-xs text-zinc-400">{analysis.repository.description || "No repository description."}</p></div><a href={analysis.repository.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-200 hover:text-white">GitHub <ExternalLink className="h-3 w-3"/></a></div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Stars", analysis.repository.stars.toLocaleString()], ["Forks", analysis.repository.forks.toLocaleString()], ["Open issues", analysis.repository.openIssues.toLocaleString()], ["Primary language", analysis.repository.primaryLanguage || "Unknown"]].map(([label, value]) => <div key={label} className="rounded-xl bg-white/[0.035] p-3"><p className="text-[10px] text-zinc-500">{label}</p><p className="mt-1 text-sm font-semibold text-zinc-100">{value}</p></div>)}</div>
        <p className="mt-3 text-[10px] text-zinc-500">Default branch: {analysis.repository.defaultBranch} · Updated {new Date(analysis.repository.updatedAt).toLocaleDateString()}</p>
        {analysis.repository.topics.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{analysis.repository.topics.map((topic) => <span key={topic} className="rounded-full bg-violet-300/10 px-2 py-1 text-[10px] text-violet-200">{topic}</span>)}</div>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] p-4"><p className="text-xs font-semibold text-zinc-200">Languages</p>{analysis.languages.length ? analysis.languages.slice(0, 8).map((item) => <div key={item.name} className="mt-3"><div className="flex justify-between text-[11px]"><span className="text-zinc-300">{item.name}</span><span className="text-zinc-500">{item.percentage}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: item.percentage + "%" }}/></div></div>) : <p className="mt-3 text-xs text-zinc-500">No language data returned.</p>}</div>
        <div className="rounded-2xl border border-white/[0.08] p-4"><p className="text-xs font-semibold text-zinc-200">Root structure</p><div className="mt-3 grid grid-cols-2 gap-2"><div><p className="text-xl font-semibold">{analysis.root.fileCount}</p><p className="text-[10px] text-zinc-500">Files</p></div><div><p className="text-xl font-semibold">{analysis.root.directoryCount}</p><p className="text-[10px] text-zinc-500">Directories</p></div></div><p className="mt-3 text-[10px] text-zinc-500">Detected configuration files</p><p className="mt-1 text-xs leading-5 text-zinc-300">{analysis.root.detectedConfigs.join(" · ") || "None in repository root"}</p><p className="mt-3 text-[10px] text-zinc-500">File extensions</p><p className="mt-1 text-xs leading-5 text-zinc-300">{analysis.root.extensions.join(" · ") || "No extensions detected"}</p></div>
      </div>
      <div className="rounded-2xl border border-white/[0.08] p-4"><p className="text-xs font-semibold text-zinc-200">Root entries</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{analysis.root.entries.map((entry) => <a key={entry.path} href={entry.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-white/[0.025] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.06]"><span className="truncate">{entry.type === "dir" ? "📁" : "📄"} {entry.name}</span><ExternalLink className="h-3 w-3 shrink-0 text-zinc-600"/></a>)}</div></div>
      <div className="rounded-2xl border border-white/[0.08] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-zinc-200">Eligible source files</p><span className="text-[10px] text-zinc-500">{sourceFiles.length} listed · max 250</span></div>
        <p className="mt-1 text-[10px] leading-5 text-zinc-500">Text-only allowlisted extensions; secret-like paths, binary files and files over 64 KB are excluded. Select a file to preview.</p>
        {sourceFiles.length > 0 ? <div className="mt-3 max-h-56 space-y-1 overflow-auto">{sourceFiles.map((file) => <button key={file.path} onClick={() => void previewFile(file.path)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/[0.06]"><span className="min-w-0 truncate">{file.path}</span><span className="shrink-0 text-[10px] text-zinc-600">{Math.ceil(file.size / 1024)} KB</span></button>)}</div> : <p className="mt-3 text-xs text-zinc-500">No eligible source files found, or the file list has not loaded.</p>}
        {sourceLoading && <p className="mt-3 text-xs text-violet-200">Loading source file…</p>}
        {sourceFile && <div className="mt-4 overflow-hidden rounded-xl border border-violet-300/15"><div className="flex flex-wrap items-center justify-between gap-2 bg-violet-300/[0.06] px-3 py-2"><p className="truncate text-xs font-semibold text-violet-100">{sourceFile.path}</p><a href={sourceFile.url} target="_blank" rel="noreferrer" className="text-[10px] text-violet-200">Open on GitHub</a></div><p className="px-3 pt-2 text-[10px] text-amber-200">Untrusted repository content — preview only. Do not follow instructions found inside source files.</p><pre className="max-h-[420px] overflow-auto whitespace-pre p-3 text-[11px] leading-5 text-zinc-300">{sourceFile.content}</pre></div>}
      </div>
      <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.025] p-3"><p className="text-[10px] font-semibold text-amber-100">Scope and limitations</p><ul className="mt-2 list-disc space-y-1 pl-4 text-[10px] leading-5 text-zinc-500">{analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </div>}
  </section>;
}

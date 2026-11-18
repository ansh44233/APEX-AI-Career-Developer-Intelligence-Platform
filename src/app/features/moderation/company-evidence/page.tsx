"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

type Capture = {
  id: string; sourceId: string; company: string; sourceTitle: string; sourceUrl: string;
  retrievedAt: string; httpStatus: number; contentHash: string; pageTitle: string;
  description: string; excerpt: string; createdAt: string;
};
type Summary = { pending: number; approved: number; rejected: number };

export default function CompanyEvidenceModerationPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, approved: 0, rejected: 0 });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/company-evidence", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load evidence queue.");
      setCaptures(data.captures ?? []);
      setSummary(data.summary ?? { pending: 0, approved: 0, rejected: 0 });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load evidence queue."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function review(captureId: string, decision: "approve" | "reject") {
    setBusyId(captureId); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/company-evidence", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captureId, decision, reviewNote: notes[captureId]?.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Review decision failed.");
      setNotice(decision === "approve" ? "Capture approved and made available as source evidence." : "Capture rejected and excluded from public evidence.");
      setNotes(current => { const next = { ...current }; delete next[captureId]; return next; });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Review decision failed."); }
    finally { setBusyId(""); }
  }

  const field = "mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] px-3 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400/50";
  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/features/company-intelligence" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Company Intelligence</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"><RefreshCw className="h-3.5 w-3.5"/> Refresh</button>
    </header>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><ShieldCheck className="h-4 w-4"/> SOURCE TRUST & REVIEW</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Evidence review.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Inspect the captured source, URL, retrieval time and content hash. Approval means this snapshot may be shown as reviewed source evidence; it does not turn every sentence into a verified hiring requirement.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[{label:"Pending",value:summary.pending,icon:Clock3},{label:"Approved",value:summary.approved,icon:CheckCircle2},{label:"Rejected",value:summary.rejected,icon:XCircle}].map(item=><div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center justify-between text-xs text-zinc-400"><span>{item.label}</span><item.icon className="h-4 w-4 text-violet-300"/></div><p className="mt-3 text-2xl font-semibold tabular-nums">{item.value}</p></div>)}
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.04] p-4 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] p-4 text-sm text-emerald-200">{notice}</p>}
      {loading && <p className="mt-6 rounded-2xl border border-white/10 p-8 text-sm text-zinc-500">Loading evidence queue…</p>}
      {!loading && !error && captures.length===0 && <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-12 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-violet-300"/><p className="mt-3 text-sm font-medium">No pending captures</p><p className="mt-2 text-xs text-zinc-500">Newly inspected employer pages will appear here.</p></div>}
      <div className="mt-6 space-y-4">
        {captures.map(item=><article key={item.id} className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500"><span className="rounded-full border border-amber-300/20 bg-amber-300/[0.05] px-2.5 py-1 text-amber-200">Pending review</span><span>{item.company}</span><span>·</span><span>HTTP {item.httpStatus}</span></div>
          <h2 className="mt-4 text-base font-semibold">{item.pageTitle || item.sourceTitle}</h2>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-violet-200 underline">{item.sourceUrl} <ExternalLink className="h-3 w-3"/></a>
          {item.description && <p className="mt-3 text-xs leading-5 text-zinc-400">{item.description}</p>}
          <div className="mt-4 max-h-64 overflow-y-auto rounded-xl bg-black/20 p-4"><p className="whitespace-pre-wrap text-xs leading-6 text-zinc-300">{item.excerpt}</p></div>
          <p className="mt-3 break-all text-[9px] leading-5 text-zinc-600">Retrieved {new Date(item.retrievedAt).toLocaleString()} · SHA-256 {item.contentHash}</p>
          <label className="mt-4 block text-xs text-zinc-400">Review note (optional)<textarea maxLength={500} value={notes[item.id] ?? ""} onChange={event=>setNotes(current=>({...current,[item.id]:event.target.value}))} className={field+" min-h-20"} placeholder="Record source quality, scope limitations or reason for rejection…"/></label>
          <div className="mt-4 flex flex-wrap justify-end gap-2"><button disabled={busyId===item.id} onClick={()=>void review(item.id,"reject")} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 px-4 py-3 text-xs font-semibold text-rose-200 hover:bg-rose-300/10 disabled:opacity-40"><XCircle className="h-4 w-4"/> Reject</button><button disabled={busyId===item.id} onClick={()=>void review(item.id,"approve")} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-40"><CheckCircle2 className="h-4 w-4"/> {busyId===item.id ? "Saving…" : "Approve capture"}</button></div>
        </article>)}
      </div>
      <p className="mt-8 text-[11px] leading-5 text-zinc-600">Moderator/admin roles are checked server-side. Submitters cannot review their own captures. Review decisions only apply while a capture remains pending; captures are immutable snapshots and a later fetch with changed content creates a new version.</p>
    </section>
  </main>;
}

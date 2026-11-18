"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

type Report = {
  id: string; company: string; role: string; experienceLevel: string; roundType: string;
  difficulty: string; interviewDate: string | null; questionText: string; experienceNote: string | null;
  sourceUrl: string | null; createdAt: string; possibleDuplicateInQueue: boolean;
};
type Summary = { pending: number; approved: number; rejected: number };

export default function InterviewExperienceModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<Summary>({ pending: 0, approved: 0, rejected: 0 });
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/interview-experiences", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load moderation queue.");
      setReports(data.reports ?? []);
      setSummary(data.summary ?? { pending: 0, approved: 0, rejected: 0 });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load moderation queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  async function review(reportId: string, decision: "approve" | "reject") {
    setBusyId(reportId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/interview-experiences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, decision, reviewNote: notes[reportId]?.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Review decision failed.");
      setNotice(decision === "approve" ? "Report approved and published." : "Report rejected and kept out of public results.");
      setNotes(current => { const next = { ...current }; delete next[reportId]; return next; });
      await loadQueue();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Review decision failed.");
    } finally {
      setBusyId("");
    }
  }

  const field = "mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] px-3 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400/50";

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/features/interview-experiences" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Experiences</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <button onClick={() => void loadQueue()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"><RefreshCw className="h-3.5 w-3.5"/> Refresh</button>
    </header>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><ShieldCheck className="h-4 w-4"/> TRUST & SAFETY</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Moderation queue.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Review first-hand experience submissions before publication. Check provenance, remove confidential or personal information, and reject duplicates or unsupported claims.</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {[{label:"Pending review",value:summary.pending,icon:Clock3},{label:"Approved",value:summary.approved,icon:CheckCircle2},{label:"Rejected",value:summary.rejected,icon:XCircle}].map(item=><div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center justify-between text-xs text-zinc-400"><span>{item.label}</span><item.icon className="h-4 w-4 text-violet-300"/></div><p className="mt-3 text-2xl font-semibold tabular-nums">{item.value}</p></div>)}
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.04] p-4 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.04] p-4 text-sm text-emerald-200">{notice}</p>}
      {loading && <p className="mt-6 rounded-2xl border border-white/10 p-8 text-sm text-zinc-500">Loading review queue…</p>}
      {!loading && !error && reports.length===0 && <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-12 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-violet-300"/><p className="mt-3 text-sm font-medium">Queue is clear</p><p className="mt-2 text-xs text-zinc-500">There are no pending reports to review.</p></div>}
      <div className="mt-6 space-y-4">
        {reports.map(report=><article key={report.id} className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500"><span className="rounded-full border border-amber-300/20 bg-amber-300/[0.05] px-2.5 py-1 text-amber-200">Pending</span><span>{report.company} · {report.role}</span><span>·</span><span>{report.roundType}</span><span>·</span><span>{report.experienceLevel}</span>{report.possibleDuplicateInQueue && <span className="rounded-full bg-rose-300/10 px-2 py-1 text-rose-200">Possible queue duplicate</span>}</div>
          <h2 className="mt-4 text-base font-semibold leading-6">{report.questionText}</h2>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-zinc-500"><span>Difficulty: {report.difficulty}</span><span>Submitted: {new Date(report.createdAt).toLocaleString()}</span>{report.interviewDate && <span>Interview date: {new Date(report.interviewDate).toLocaleDateString()}</span>}</div>
          {report.experienceNote && <div className="mt-4 rounded-xl bg-black/20 p-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Contributor context</p><p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{report.experienceNote}</p></div>}
          {report.sourceUrl && <a href={report.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-violet-200 underline">Inspect cited source <ExternalLink className="h-3 w-3"/></a>}
          <label className="mt-5 block text-xs text-zinc-400">Moderator note (optional)<textarea maxLength={500} value={notes[report.id] ?? ""} onChange={event=>setNotes(current=>({...current,[report.id]:event.target.value}))} className={field+" min-h-20"} placeholder="Reason for rejection, edit request, or review context…"/></label>
          <div className="mt-4 flex flex-wrap justify-end gap-2"><button disabled={busyId===report.id} onClick={()=>void review(report.id,"reject")} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 px-4 py-3 text-xs font-semibold text-rose-200 hover:bg-rose-300/10 disabled:opacity-40"><XCircle className="h-4 w-4"/> Reject</button><button disabled={busyId===report.id} onClick={()=>void review(report.id,"approve")} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-40"><CheckCircle2 className="h-4 w-4"/> {busyId===report.id ? "Saving…" : "Approve & publish"}</button></div>
        </article>)}
      </div>
      <p className="mt-8 text-[11px] leading-5 text-zinc-600">Moderator access is checked against the server-side user role for every request. Moderators cannot review their own submissions. Review decisions are conditional on the report still being pending, preventing stale double-approval actions.</p>
    </section>
  </main>;
}

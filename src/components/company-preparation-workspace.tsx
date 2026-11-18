"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Building2, CheckCircle2, Loader2, RefreshCw, Route, Target } from "lucide-react";

type Workspace = {
  goal: { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null; status: string };
  evidence: { id: string; claimType: string; claimText: string; supportingExcerpt: string; capture: { sourceTitle: string; sourceUrl: string; retrievedAt: string; contentHash: string } }[];
  roadmap: { total: number; completed: number; inProgress: number; percent: number; nextTasks: { id: string; title: string; description: string; phase: string; module: string; status: string; evidenceClaim: { id: string; claimType: string; claimText: string; supportingExcerpt: string } | null }[] };
  practice: { sessions: number; attempts: number; moduleCounts: { module: string; count: number }[] };
  methodology: string;
};

export function CompanyPreparationWorkspace({ goalId }: { goalId: string }) {
  const [data, setData] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!goalId) { setData(null); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/intelligence/company-prep?goalId=${encodeURIComponent(goalId)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load this career goal workspace.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this career goal workspace.");
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => { void load(); }, [load]);

  if (!goalId) return (
    <section className="rounded-3xl border border-white/10 bg-[#111119] p-5">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-violet-200"><Target className="h-4 w-4"/> COMPANY-TO-CAREER WORKSPACE</p>
      <p className="mt-3 text-sm text-zinc-300">Choose a saved career goal in the practice panel to connect company evidence, roadmap progress and goal-linked sessions.</p>
      <a href="/dashboard" className="mt-3 inline-flex items-center gap-2 text-xs text-violet-200">Manage career goals <ArrowUpRight className="h-3 w-3"/></a>
    </section>
  );

  return (
    <section className="rounded-3xl border border-violet-300/15 bg-[#111119] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-violet-200"><Target className="h-4 w-4"/> COMPANY-TO-CAREER WORKSPACE</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{data?.goal.targetCompany || "General career goal"} · {data?.goal.targetRole || "Selected goal"}</h2>
          <p className="mt-1 text-xs text-zinc-500">One view of approved evidence, preparation tasks and practice linked to this goal.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} aria-label="Refresh career workspace" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-40"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}/></button>
      </div>

      {loading ? <p className="mt-5 flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin"/> Connecting your preparation data…</p> :
      error ? <p role="alert" className="mt-5 text-sm text-rose-300">{error}</p> : data ? <>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Approved evidence", data.evidence.length],
            ["Roadmap complete", `${data.roadmap.completed}/${data.roadmap.total}`],
            ["Linked sessions", data.practice.sessions],
            ["Saved attempts", data.practice.attempts],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums text-white">{value}</p></div>)}
        </div>

        <div className="mt-5 rounded-xl border border-white/[0.07] p-4">
          <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><Route className="h-4 w-4 text-violet-300"/> Roadmap progress</p><span className="text-xs tabular-nums text-violet-200">{data.roadmap.percent}%</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: `${data.roadmap.percent}%` }}/></div>
          <p className="mt-2 text-[10px] text-zinc-500">{data.roadmap.inProgress} in progress · completion is self-reported</p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-zinc-300">NEXT ROADMAP TASKS</p>
            {data.roadmap.nextTasks.length ? <ul className="mt-3 space-y-2">{data.roadmap.nextTasks.map(task => <li key={task.id} className="rounded-xl border border-white/[0.07] p-3"><p className="text-[9px] uppercase tracking-wider text-violet-300">{task.phase} · {task.status.replace("_", " ")}</p><p className="mt-1 text-xs font-medium text-zinc-200">{task.title}</p><p className="mt-1 text-[10px] leading-5 text-zinc-500">{task.description}</p>{task.evidenceClaim && <p className="mt-2 border-l border-emerald-300/30 pl-2 text-[10px] text-emerald-200">Evidence-linked task: {task.evidenceClaim.claimText}</p>}<a href={task.module} className="mt-2 inline-flex items-center gap-1 text-[10px] text-violet-200">Open practice <ArrowUpRight className="h-3 w-3"/></a></li>)}</ul> : <p className="mt-3 text-xs text-zinc-500">No outstanding roadmap tasks. Add or reactivate a goal to generate a new plan.</p>}
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><Building2 className="h-4 w-4 text-emerald-200"/> APPROVED COMPANY EVIDENCE</p>
            {data.evidence.length ? <ul className="mt-3 space-y-2">{data.evidence.slice(0, 5).map(claim => <li key={claim.id} className="rounded-xl border border-white/[0.07] p-3"><p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200">{claim.claimType === "explicit_requirement" ? "Explicit requirement" : "Employer guidance"}</p><p className="mt-1 text-xs text-zinc-300">{claim.claimText}</p><blockquote className="mt-2 border-l border-white/15 pl-2 text-[10px] leading-5 text-zinc-500">{claim.supportingExcerpt}</blockquote><a href={claim.capture.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-200 underline underline-offset-4">{claim.capture.sourceTitle} <ArrowUpRight className="h-3 w-3"/></a></li>)}</ul> : <p className="mt-3 text-xs leading-5 text-zinc-500">No moderator-approved evidence exists for this exact company and role yet. General APEX-authored preparation remains available.</p>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">{data.practice.moduleCounts.map(item => <span key={item.module} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-zinc-400">{item.module}: {item.count} sessions</span>)}</div>
        <p className="mt-4 text-[10px] leading-5 text-zinc-600">{data.methodology}</p>
        <div className="mt-4 flex flex-wrap gap-3"><a href="/features/company-intelligence" className="text-xs text-violet-200 hover:text-white">Company Intelligence <ArrowUpRight className="ml-1 inline h-3 w-3"/></a><a href="/features/mock-interview" className="text-xs text-violet-200 hover:text-white">Mock Interview <ArrowUpRight className="ml-1 inline h-3 w-3"/></a><a href="/dashboard" className="text-xs text-violet-200 hover:text-white">Career dashboard <ArrowUpRight className="ml-1 inline h-3 w-3"/></a></div>
      </> : null}
    </section>
  );
}

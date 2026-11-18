"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, RefreshCw, Route, Target } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Step = {
  id: string; title: string; description: string; skillKey: string; module: string;
  phase: string; status: string; priority: number; reason: string;
  latestSelfRating: number | null; lastPractisedAt: string | null;
  daysSincePractice: number | null; evidenceBacked: boolean;
};
type Path = {
  goal: { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null };
  progress: { totalTasks: number; completedTasks: number; inProgressTasks: number };
  practice: { linkedSessions: number; attempts: number; modules: string[] };
  assessedSkillCount: number;
  nextSteps: Step[];
};
type Payload = { paths: Path[]; methodology: string; limits: string };

function moduleLabel(value: string) {
  return value.replace("/features/", "").replaceAll("-", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export function PersonalisedLearningPathPanel() {
  const { data: session, isPending } = authClient.useSession();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/learning-path", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load personalised learning paths.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Learning paths are unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) void load();
    else setData(null);
  }, [session?.user.id, load]);

  if (isPending) return null;

  return <section className="rounded-3xl border border-cyan-300/15 bg-[#10151a] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-cyan-300"><Route className="h-4 w-4"/> PHASE 35 · PERSONALISED LEARNING</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Your next learning sequence</h2>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">A goal-by-goal sequence that adapts to saved roadmap progress, self-assessments and practice recency.</p>
      </div>
      {session && <button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5 disabled:opacity-50"><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}/> Refresh</button>}
    </div>

    {!session && <div className="mt-4 rounded-xl border border-white/[0.07] p-4"><p className="text-xs text-zinc-400">Sign in to build learning paths from your saved career goals and practice history.</p><a href="/sign-in" className="mt-3 inline-flex rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950">Sign in</a></div>}
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
    {session && loading && !data && <p className="mt-4 text-xs text-zinc-500">Building your learning sequence…</p>}
    {session && data && data.paths.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4"><p className="text-sm font-medium text-zinc-200">No active career goal yet</p><p className="mt-1 text-xs text-zinc-500">Create a goal to connect roadmap tasks, skill ratings and practice sessions.</p><a href="/dashboard" className="mt-3 inline-flex text-xs text-cyan-300">Create a career goal <ArrowUpRight className="ml-1 h-3 w-3"/></a></div>}

    {session && data && data.paths.length > 0 && <div className="mt-5 space-y-4">
      {data.paths.map(path => <article key={path.goal.id} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="text-sm font-semibold text-white">{path.goal.targetRole}</h3><p className="mt-1 text-[10px] text-zinc-500">{path.goal.targetCompany || "Company not specified"} · {path.practice.linkedSessions} linked sessions · {path.practice.attempts} saved attempts</p></div>
          <span className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-zinc-400">{path.progress.completedTasks}/{path.progress.totalTasks} roadmap tasks complete</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400" style={{ width: (path.progress.totalTasks ? Math.round(path.progress.completedTasks / path.progress.totalTasks * 100) : 0) + "%" }}/></div>
        <p className="mb-3 mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400"><Target className="h-3.5 w-3.5 text-cyan-300"/> Prioritised next steps</p>
        {path.nextSteps.length === 0 ? <p className="rounded-xl border border-emerald-300/15 p-3 text-xs text-emerald-200">All currently generated roadmap tasks are marked complete. Review your goal or add new preparation evidence.</p> :
          <ol className="space-y-2">{path.nextSteps.map((step, index) => <li key={step.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-[10px] font-semibold text-cyan-200">{index + 1}</span><div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h4 className="text-xs font-semibold text-zinc-200">{step.title}</h4>{step.evidenceBacked && <span className="rounded-md border border-emerald-300/20 px-1.5 py-0.5 text-[9px] text-emerald-200">Approved evidence</span>}{step.status === "in_progress" && <span className="rounded-md border border-amber-300/20 px-1.5 py-0.5 text-[9px] text-amber-200">In progress</span>}</div>
              <p className="mt-1 text-[10px] leading-5 text-zinc-500">{step.reason}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] text-zinc-600"><span>{step.latestSelfRating === null ? "Not self-assessed" : "Self-rating " + step.latestSelfRating + "/5"}</span><span>{step.daysSincePractice === null ? "No linked module practice" : step.daysSincePractice + " days since module practice"}</span><span>{moduleLabel(step.module)}</span></div>
            </div><a href={step.module} aria-label={"Start " + step.title} className="shrink-0 rounded-lg border border-cyan-300/20 p-2 text-cyan-200 hover:bg-cyan-300/10"><BookOpen className="h-4 w-4"/></a></div>
          </li>)}</ol>}
      </article>)}
    </div>}
    <p className="mt-4 text-[10px] leading-5 text-zinc-600">{data?.methodology} {data?.limits}</p>
  </section>;
}

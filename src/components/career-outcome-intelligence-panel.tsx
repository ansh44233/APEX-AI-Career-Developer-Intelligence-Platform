"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, CheckCircle2, RefreshCw, Target, TrendingUp, type LucideIcon } from "lucide-react";

type Outcome = {
  generatedAt: string;
  totals: { goals: number; activeGoals: number; linkedPracticeSessions: number; linkedApplications: number; linkedRoadmapTasks: number; completedRoadmapTasks: number; completedRecommendationActions: number };
  goals: Array<{
    goal: { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null; status: string };
    preparation: { roadmapTotal: number; roadmapCompleted: number; roadmapPercent: number | null; jobTasksTotal: number; jobTasksCompleted: number; jobTaskPercent: number | null };
    skillRatings: { skillsAssessed: number; comparableSkills: number; higher: number; lower: number; unchanged: number; changes: Array<{ skillKey: string; firstRating: number | null; latestRating: number | null; assessments: number; change: string }> };
    practice: { sessions: number; attempts: number; completedSessions: number; sessionsLast30Days: number; modules: string[] };
    applications: { total: number; byStatus: Record<string, number>; recent: Array<{ id: string; company: string; role: string; status: string; updatedAt: string }> };
    followThrough: { recommendationActions: Record<string, number>; timelineEvents: number; timelineCompleted: number; timelinePending: number; timelineCompletionPercent: number | null };
  }>;
  scope: string;
  limits: string;
};

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: LucideIcon }) {
  return <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><div className="flex items-center justify-between text-[10px] text-zinc-500"><span>{label}</span><Icon className="h-3.5 w-3.5 text-violet-300"/></div><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>;
}
function pretty(value: string) { return value.replaceAll("_", " ").replaceAll("-", " "); }

export function CareerOutcomeIntelligencePanel() {
  const [data, setData] = useState<Outcome | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/outcomes", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load career outcomes.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Career outcome intelligence is unavailable.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <section className="rounded-3xl border border-cyan-300/15 bg-[#10151b] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-cyan-300"><TrendingUp className="h-4 w-4"/> PHASE 33 · CAREER OUTCOMES</p><h2 className="mt-2 text-xl font-semibold text-white">Career Outcome Intelligence</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">See how saved preparation, skill self-ratings, practice, applications and follow-through connect to each career goal.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh career outcomes" className="rounded-xl border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}/></button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
    {loading && !data && <p className="mt-5 text-xs text-zinc-500">Connecting saved career records…</p>}
    {data && <>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active goals" value={data.totals.activeGoals} icon={Target}/>
        <Metric label="Goal-linked sessions" value={data.totals.linkedPracticeSessions} icon={Activity}/>
        <Metric label="Linked applications" value={data.totals.linkedApplications} icon={BriefcaseBusiness}/>
        <Metric label="Roadmap tasks completed" value={data.totals.completedRoadmapTasks + " / " + data.totals.linkedRoadmapTasks} icon={CheckCircle2}/>
      </div>
      {data.goals.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-white/10 p-5 text-xs text-zinc-500">Create a career goal and link practice sessions or applications to begin building an outcome history.</p> :
        <div className="mt-5 space-y-3">{data.goals.map(item => <article key={item.goal.id} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-white">{item.goal.targetRole}</h3><p className="mt-1 text-[10px] text-zinc-500">{item.goal.targetCompany || "No target company"} · {item.goal.status}</p></div><a href={"/dashboard"} className="text-[10px] text-cyan-300 hover:text-white">Open goal ↗</a></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white/[0.03] p-3"><p className="text-[10px] text-zinc-500">Roadmap completion</p><p className="mt-1 text-lg font-semibold text-white">{item.preparation.roadmapPercent === null ? "—" : item.preparation.roadmapPercent + "%"}</p><p className="text-[10px] text-zinc-600">{item.preparation.roadmapCompleted}/{item.preparation.roadmapTotal} tasks</p></div>
            <div className="rounded-xl bg-white/[0.03] p-3"><p className="text-[10px] text-zinc-500">Practice activity</p><p className="mt-1 text-lg font-semibold text-white">{item.practice.sessions} sessions</p><p className="text-[10px] text-zinc-600">{item.practice.attempts} attempts · {item.practice.sessionsLast30Days} in 30 days</p></div>
            <div className="rounded-xl bg-white/[0.03] p-3"><p className="text-[10px] text-zinc-500">Applications</p><p className="mt-1 text-lg font-semibold text-white">{item.applications.total}</p><p className="text-[10px] text-zinc-600">{Object.entries(item.applications.byStatus).map(([key,value]) => pretty(key)+": "+value).join(" · ") || "No linked applications"}</p></div>
            <div className="rounded-xl bg-white/[0.03] p-3"><p className="text-[10px] text-zinc-500">Action follow-through</p><p className="mt-1 text-lg font-semibold text-white">{item.followThrough.recommendationActions.completed} done</p><p className="text-[10px] text-zinc-600">{item.followThrough.recommendationActions.accepted || 0} accepted · {item.followThrough.recommendationActions.deferred || 0} deferred</p></div>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] p-3"><h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Self-rating history</h4>
              {item.skillRatings.changes.length === 0 ? <p className="mt-2 text-[10px] text-zinc-600">No goal-linked skill ratings recorded.</p> : <><div className="mt-2 flex flex-wrap gap-3 text-[10px]"><span className="flex items-center gap-1 text-emerald-300"><ArrowUpRight className="h-3 w-3"/>{item.skillRatings.higher} higher</span><span className="flex items-center gap-1 text-rose-300"><ArrowDownRight className="h-3 w-3"/>{item.skillRatings.lower} lower</span><span className="text-zinc-400">{item.skillRatings.unchanged} unchanged</span></div><div className="mt-2 flex flex-wrap gap-1.5">{item.skillRatings.changes.slice(0,8).map(skill => <span key={skill.skillKey} className="rounded-md border border-white/[0.07] px-2 py-1 text-[9px] text-zinc-400">{pretty(skill.skillKey)} · {skill.firstRating === null ? "first "+skill.latestRating+"/5" : skill.firstRating+" → "+skill.latestRating+"/5"}</span>)}</div></>}
            </div>
            <div className="rounded-xl border border-white/[0.06] p-3"><h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Follow-through and coverage</h4><p className="mt-2 text-[10px] text-zinc-400">{item.followThrough.timelineCompleted}/{item.followThrough.timelineEvents} timeline actions completed · {item.followThrough.timelinePending} pending</p><p className="mt-1 text-[10px] text-zinc-400">{item.preparation.jobTasksCompleted}/{item.preparation.jobTasksTotal} job-specific preparation tasks completed</p><p className="mt-1 text-[10px] text-zinc-400">Practice modules: {item.practice.modules.map(pretty).join(", ") || "None recorded"}</p><p className="mt-1 text-[10px] text-zinc-400">Completed recommendation actions: {item.followThrough.recommendationActions.completed || 0}</p></div>
          </div>
        </article>)}</div>}
      <p className="mt-4 text-[10px] leading-5 text-zinc-600">Only explicitly goal-linked records are included. Self-rating changes are not verified skill gains; practice is activity, task completion is user-reported, and application stages are entered by you. This is not a readiness score, hiring prediction or outcome guarantee.</p>
    </>}
  </section>;
}

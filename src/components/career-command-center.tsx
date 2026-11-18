"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, Compass, RefreshCw, Sparkles, Target, TrendingUp } from "lucide-react";
import { RecommendationTrackerPanel } from "@/components/recommendation-tracker-panel";
import { CareerOutcomeIntelligencePanel } from "@/components/career-outcome-intelligence-panel";
import { PersonalisedLearningPathPanel } from "@/components/personalised-learning-path-panel";

type Pipeline = {
  applications: { total: number; active: number; byStatus: Record<string, number> };
  timeline: { pending: number; completed: number; upcomingCount: number; overdueCount: number };
  preparation: { totalTasks: number; completedTasks: number; inProgressTasks: number; todoTasks: number; completionPercent: number | null };
  recentApplications: Array<{ id: string; company: string; role: string; status: string; preparation: { total: number; completed: number } }>;
  upcomingEvents: Array<{ id: string; jobId: string; title: string; eventType: string; scheduledAt: string; job: { company: string; role: string } }>;
  overdueEvents: Array<{ id: string; jobId: string; title: string; eventType: string; scheduledAt: string; job: { company: string; role: string } }>;
};
type Overview = { totals: { sessions: number; attempts: number; completedSessions: number }; recentActivity: Array<{ id: string; module: string; title: string; status: string; startedAt: string }> };
type Recommendations = { recommendations: Array<{ id: string; title: string; reason: string; href: string; basis: string }>; moduleActivity: Array<{ module: string; label: string; sessions: number; lastPractisedAt: string | null }> };
type Roadmap = { goals: Array<{ goal: { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null }; tasks: Array<{ id: string; title: string; module: string; status: string; evidenceClaim?: { sourceTitle: string; sourceUrl: string; claimType: string; supportingExcerpt: string } | null }>; progress: { total: number; completed: number; inProgress: number; percent: number } }> };
type Coverage = { goals: Array<{ goal: { id: string }; template: { label: string }; totals: { requiredSkills: number; assessedSkills: number; notYetAssessed: number; assessmentCoveragePercent: number } }> };

function dateLabel(value: string) {
  return new Date(value).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export function CareerCommandCenter() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const endpoints = [
        "/api/intelligence/career-pipeline",
        "/api/intelligence/overview",
        "/api/intelligence/recommendations",
        "/api/intelligence/roadmap",
        "/api/intelligence/role-coverage",
      ];
      const responses = await Promise.all(endpoints.map((url) => fetch(url, { cache: "no-store" })));
      const payloads = await Promise.all(responses.map((response) => response.json()));
      const failed = responses.findIndex((response) => !response.ok);
      if (failed >= 0) throw new Error(payloads[failed]?.error || "Some career intelligence data could not be loaded.");
      setPipeline(payloads[0]); setOverview(payloads[1]); setRecommendations(payloads[2]); setRoadmap(payloads[3]); setCoverage(payloads[4]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Career command center is unavailable.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const completeTimelineEvent = useCallback(async (eventId: string) => {
    setUpdatingEventId(eventId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/job-events/" + eventId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update this timeline event.");
      setNotice("Timeline event marked complete.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this timeline event.");
    } finally {
      setUpdatingEventId(null);
    }
  }, [load]);

  const actions = useMemo(() => {
    if (!pipeline) return [];
    const items: Array<{ id: string; title: string; reason: string; href: string; kind: string; priority: number; eventId?: string }> = [];
    for (const event of pipeline.overdueEvents.slice(0, 3)) items.push({
      id: "overdue-" + event.id, title: "Review overdue: " + event.title,
      reason: event.job.company + " · " + event.job.role + " · " + dateLabel(event.scheduledAt),
      href: "/features/application-follow-ups", kind: "Past due", priority: 100, eventId: event.id,
    });
    for (const event of pipeline.upcomingEvents.slice(0, 3)) items.push({
      id: "upcoming-" + event.id, title: "Prepare for: " + event.title,
      reason: event.job.company + " · " + event.job.role + " · " + dateLabel(event.scheduledAt),
      href: "/features/application-follow-ups", kind: "Upcoming", priority: 85, eventId: event.id,
    });
    const nextTask = roadmap?.goals.flatMap((group) => group.tasks.filter((task) => task.status !== "completed").slice(0, 2).map((task) => ({ group, task })))[0];
    if (nextTask) items.push({
      id: "roadmap-" + nextTask.task.id, title: nextTask.task.title,
      reason: nextTask.group.goal.targetCompany ? nextTask.group.goal.targetCompany + " · " + nextTask.group.goal.targetRole : nextTask.group.goal.targetRole,
      href: nextTask.task.module, kind: "Preparation", priority: 60,
    });
    for (const item of recommendations?.recommendations.slice(0, 2) ?? []) items.push({
      id: "practice-" + item.id, title: item.title, reason: item.reason, href: item.href, kind: "Practice", priority: 40,
    });
    return items.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }, [pipeline, roadmap, recommendations]);

  if (loading) return <div className="rounded-3xl border border-white/10 bg-[#111119] p-8 text-sm text-zinc-500">Connecting your career workspace…</div>;
  if (error) return <div className="rounded-3xl border border-white/10 bg-[#111119] p-6"><p className="text-sm text-rose-200">{error}</p><button onClick={() => void load()} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300">Retry</button></div>;
  if (!pipeline || !overview || !recommendations || !roadmap || !coverage) return null;

  const coverageTotal = coverage.goals.reduce((sum, item) => sum + item.totals.requiredSkills, 0);
  const coverageAssessed = coverage.goals.reduce((sum, item) => sum + item.totals.assessedSkills, 0);
  const weeklySessions = overview.recentActivity.filter((item) => new Date(item.startedAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000).length;
  const focusGoal = roadmap.goals[0];

  return <div className="space-y-6">
    <RecommendationTrackerPanel />
    <CareerOutcomeIntelligencePanel />
    <PersonalisedLearningPathPanel />
    {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}
    <section className="rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.09] via-[#111119] to-[#111119] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-violet-300"><Compass className="h-4 w-4"/> YOUR CAREER COMMAND CENTER</p><h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">One workspace. Clear next steps.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">A live snapshot of your saved applications, preparation tasks, practice activity and career goals. Recommendations are based on recorded data, not hiring predictions.</p></div>
        <button onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"><RefreshCw className="h-3.5 w-3.5"/> Refresh</button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={BriefcaseBusiness} label="Applications" value={pipeline.applications.total} note={pipeline.applications.active + " active"} />
        <Metric icon={CalendarClock} label="Needs attention" value={pipeline.timeline.overdueCount} note={pipeline.timeline.upcomingCount + " upcoming actions"} />
        <Metric icon={Target} label="Preparation" value={pipeline.preparation.totalTasks ? pipeline.preparation.completedTasks + "/" + pipeline.preparation.totalTasks : "—"} note={pipeline.preparation.completionPercent === null ? "No job tasks yet" : pipeline.preparation.completionPercent + "% marked complete"} />
        <Metric icon={TrendingUp} label="Practice sessions" value={overview.totals.sessions} note={overview.totals.attempts + " saved attempts"} />
      </div>
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.18em] text-violet-300">ACTION QUEUE</p><h2 className="mt-1 text-lg font-semibold">What to do next</h2></div><a href="/features/agent-workbench?skill=career-copilot" className="text-xs text-violet-300 hover:text-violet-200">Ask Career Copilot ↗</a></div>
        {actions.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-5 text-xs text-zinc-500">No urgent actions are recorded. Add a career goal, job application or timeline event to build your plan.</p> : <div className="space-y-3">{actions.map((item, index) => <article key={item.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-400/10 text-xs font-semibold text-violet-200">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium text-zinc-200">{item.title}</h3><span className="rounded-md border border-white/10 px-2 py-0.5 text-[9px] text-zinc-500">{item.kind}</span></div><p className="mt-1 text-[11px] leading-5 text-zinc-500">{item.reason}</p></div><div className="flex shrink-0 items-center gap-2">{item.eventId && <button type="button" disabled={updatingEventId === item.eventId} onClick={() => void completeTimelineEvent(item.eventId!)} className="rounded-lg border border-emerald-300/20 px-2.5 py-1.5 text-[10px] font-medium text-emerald-200 hover:bg-emerald-300/10 disabled:opacity-50">{updatingEventId === item.eventId ? "Saving…" : "Mark done"}</button>}<a href={item.href} aria-label={"Open " + item.title} className="text-violet-300 hover:text-white"><ArrowUpRight className="h-4 w-4"/></a></div></article>)}</div>}

      </div>
      <div className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-violet-300">CAREER GOAL</p>
        {focusGoal ? <><h2 className="mt-2 text-lg font-semibold text-white">{focusGoal.goal.targetRole}</h2><p className="mt-1 text-xs text-zinc-500">{focusGoal.goal.targetCompany || "Company not specified"}{focusGoal.goal.targetDate ? " · Target " + new Date(focusGoal.goal.targetDate).toLocaleDateString() : ""}</p><div className="mt-5 flex items-end justify-between"><span className="text-xs text-zinc-400">Preparation checklist</span><span className="text-xl font-semibold text-violet-200">{focusGoal.progress.percent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: focusGoal.progress.percent + "%" }}/></div><p className="mt-2 text-[10px] text-zinc-600">{focusGoal.progress.completed} of {focusGoal.progress.total} tasks marked complete</p><a href="/dashboard" className="mt-5 inline-flex text-xs text-violet-300 hover:text-violet-200">Open goal and skill profile ↗</a></> : <><h2 className="mt-2 text-lg font-semibold">No active goal yet</h2><p className="mt-2 text-xs leading-5 text-zinc-500">Create a target role in your dashboard to connect skills, roadmap tasks and company evidence.</p><a href="/dashboard" className="mt-4 inline-flex text-xs text-violet-300">Create a career goal ↗</a></>}
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-3">
      <SummaryCard title="Application pipeline" icon={BriefcaseBusiness} href="/features/job-intelligence" action="Manage jobs">
        <div className="space-y-2">{Object.entries({ Saved: pipeline.applications.byStatus.saved || 0, Applied: pipeline.applications.byStatus.applied || 0, Interview: pipeline.applications.byStatus.interview || 0, Offers: pipeline.applications.byStatus.offer || 0 }).map(([label, count]) => <div key={label} className="flex justify-between text-xs"><span className="text-zinc-500">{label}</span><span className="tabular-nums text-zinc-200">{count}</span></div>)}</div>
      </SummaryCard>
      <SummaryCard title="Skill coverage" icon={Target} href="/dashboard" action="Review assessments">
        <p className="text-2xl font-semibold text-white">{coverageAssessed}/{coverageTotal || 0}</p><p className="mt-1 text-[11px] text-zinc-500">Role-template skills with a saved self-assessment</p><p className="mt-3 text-[10px] leading-4 text-zinc-600">Coverage is not a proficiency or readiness score.</p>
      </SummaryCard>
      <SummaryCard title="This week's activity" icon={TrendingUp} href="/dashboard" action="View analytics">
        <p className="text-2xl font-semibold text-white">{weeklySessions}</p><p className="mt-1 text-[11px] text-zinc-500">Sessions started in the last 7 days</p><p className="mt-3 text-[10px] leading-4 text-zinc-600">{overview.totals.completedSessions} completed sessions overall · activity is not mastery.</p>
      </SummaryCard>
    </section>

    <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.18em] text-violet-300">WEEKLY CAREER REVIEW</p><h2 className="mt-1 text-lg font-semibold">Your recorded progress</h2></div><a href="/features/career-pipeline" className="text-xs text-violet-300">Detailed pipeline ↗</a></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><p className="text-2xl font-semibold text-white">{weeklySessions}</p><p className="mt-1 text-[11px] text-zinc-500">Sessions started this week</p></div>
        <div><p className="text-2xl font-semibold text-white">{pipeline.timeline.completed}</p><p className="mt-1 text-[11px] text-zinc-500">Timeline events marked complete</p></div>
        <div><p className="text-2xl font-semibold text-white">{pipeline.preparation.completedTasks}</p><p className="mt-1 text-[11px] text-zinc-500">Preparation tasks marked complete</p></div>
      </div>
      <p className="mt-4 text-[10px] leading-5 text-zinc-600">This is an on-demand summary of saved records, not an automatically delivered weekly report. Counts are descriptive and do not establish skill proficiency or hiring outcomes.</p>
    </section>

    <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-violet-300/15 bg-violet-300/[0.04] p-5 sm:p-6">
      <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-violet-300"/><div><h2 className="font-semibold text-white">Want a deeper explanation?</h2><p className="mt-1 text-xs text-zinc-500">Ask Career Copilot to interpret your saved context. Sharing account data is optional and off by default.</p></div></div>
      <a href="/features/agent-workbench?skill=career-copilot" className="rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-400">Open Career Copilot <ArrowUpRight className="ml-1 inline h-3.5 w-3.5"/></a>
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof BriefcaseBusiness; label: string; value: number | string; note: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"><div className="flex items-center justify-between"><p className="text-[11px] text-zinc-500">{label}</p><Icon className="h-4 w-4 text-violet-300"/></div><p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p><p className="mt-1 text-[10px] text-zinc-600">{note}</p></div>;
}
function SummaryCard({ title, icon: Icon, href, action, children }: { title: string; icon: typeof BriefcaseBusiness; href: string; action: string; children: ReactNode }) {
  return <article className="rounded-3xl border border-white/10 bg-[#111119] p-5"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200"><Icon className="h-4 w-4 text-violet-300"/>{title}</h3><a href={href} className="text-[10px] text-violet-300">{action} ↗</a></div>{children}</article>;
}

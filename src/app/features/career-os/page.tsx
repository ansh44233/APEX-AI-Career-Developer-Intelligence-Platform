"use client";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpenCheck, BrainCircuit, BriefcaseBusiness, Building2, CalendarClock, CheckCircle2, Compass, Layers3, RefreshCw, Route, Sparkles, Target, TrendingUp } from "lucide-react";

type Goal = { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null };
type RoadmapStep = { id: string; phase: string; title: string; description: string; skillKey: string; module: string; status: string; priority: number; reason: string; evidenceBacked: boolean; latestSelfRating: number | null; taskPractice: { sessions: number; attempts: number }; evaluation: { count: number; latestSelfRating: number | null; trend: string } };
type LearningPath = { paths: Array<{ goal: Goal; progress: { totalTasks: number; completedTasks: number; inProgressTasks: number }; nextSteps: RoadmapStep[] }> };
type PlanItem = { id: string; title: string; reason: string; href: string; basis: string; goalId?: string; jobId?: string; dueAt: string | null; urgency: "urgent" | "soon" | "flexible"; estimatedMinutes: number; sourceLabel: string; evidence?: { title: string; url: string; excerpt: string } | null };
type DailyPlan = { items: PlanItem[]; summary: { activeGoals: number; upcomingEvents: number; linkedApplications: number; incompleteRoadmapTasks: number }; weeklyReview: { practiceSessions: number; completedTimelineEvents: number; completedRoadmapTasks: number; completedJobPreparationTasks: number; completedRecommendations: number } };
type Skill = { skillKey: string; assessment: { rating: number; assessedAt: string; source: string } | null; roadmap: { tasks: number; completed: number; open: number }; practice: { evaluatedAttempts: number; latestRubricAverage: number | null } };
type Graph = { goals: Array<{ goal: Goal; nodes: { skills: Skill[]; claims: Array<{ claimType: string; claimText: string; supportingExcerpt: string; capture: { sourceTitle: string; sourceUrl: string } }>; applications: { total: number } } }> };
type Payload = { learning: LearningPath; plan: DailyPlan; graph: Graph };

const stages = [
  { id: "direction", number: "01", title: "Choose direction", detail: "Explore and compare career paths.", href: "/features/career-twin", icon: Compass },
  { id: "research", number: "02", title: "Research employers", detail: "Review company sources and role context.", href: "/features/company-intelligence", icon: Building2 },
  { id: "assess", number: "03", title: "Understand skill gaps", detail: "Use self-assessments and practice signals.", href: "/features/career-command-center", icon: BrainCircuit },
  { id: "prepare", number: "04", title: "Build capability", detail: "Follow the personalised learning roadmap.", href: "/features/career-command-center", icon: BookOpenCheck },
  { id: "execute", number: "05", title: "Execute priorities", detail: "Review and approve your daily action plan.", href: "/features/career-command-center", icon: CalendarClock },
  { id: "review", number: "06", title: "Review progress", detail: "Use saved outcomes to adjust your strategy.", href: "/features/career-command-center", icon: TrendingUp },
];

export default function CareerOperatingSystemPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [goalId, setGoalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const endpoints = ["/api/intelligence/learning-path", "/api/intelligence/daily-plan", "/api/intelligence/graph"];
      const responses = await Promise.all(endpoints.map(url => fetch(url, { cache: "no-store" })));
      const results = await Promise.all(responses.map(response => response.json()));
      const failed = responses.findIndex(response => !response.ok);
      if (failed !== -1) throw new Error(results[failed]?.error || "Some career intelligence data could not be loaded.");
      const next = { learning: results[0], plan: results[1], graph: results[2] } as Payload;
      setPayload(next);
      setGoalId(current => current && next.learning.paths.some(path => path.goal.id === current) ? current : next.learning.paths[0]?.goal.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Career Operating System is unavailable.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const current = payload?.learning.paths.find(path => path.goal.id === goalId) ?? payload?.learning.paths[0] ?? null;
  const graph = payload?.graph.goals.find(item => item.goal.id === goalId) ?? payload?.graph.goals[0] ?? null;
  const skills = graph?.nodes.skills ?? [];
  const signals = useMemo(() => ({
    assessed: skills.filter(skill => skill.assessment !== null).length,
    low: skills.filter(skill => skill.assessment !== null && skill.assessment!.rating <= 2).length,
    practiceEvaluated: skills.reduce((sum, skill) => sum + skill.practice.evaluatedAttempts, 0),
    evidence: graph?.nodes.claims.length ?? 0,
  }), [skills, graph]);
  const planItems = payload?.plan.items.filter(item => !item.goalId || item.goalId === goalId).slice(0, 6) ?? [];
  const nextStep = current?.nextSteps[0] ?? null;
  const progressPercent = current && current.progress.totalTasks > 0 ? Math.round(current.progress.completedTasks / current.progress.totalTasks * 100) : 0;
  const planMinutes = planItems.reduce((sum, item) => sum + item.estimatedMinutes, 0);

  return <ApexWorkspaceShell><div className="min-h-screen text-[var(--text)]">
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-7 sm:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-cyan-200"><Route className="h-4 w-4"/> PHASE 45 · CAREER OPERATING SYSTEM</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">One connected <span className="text-cyan-200">career journey.</span></h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Move from choosing a direction to researching employers, building skills, executing priorities and reviewing real progress — all from one workspace.</p>
      </div>

      {error && <div role="alert" className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-xs text-rose-200">{error}</div>}
      <section className="mb-6 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)]">YOUR ACTIVE DIRECTION</p><h2 className="mt-2 text-lg font-semibold">{current ? current.goal.targetRole : loading ? "Loading career profile…" : "No active career goal"}</h2><p className="mt-1 text-xs text-[var(--muted)]">{current?.goal.targetCompany || "No target company saved"}{current?.goal.targetDate ? " · Target " + new Date(current.goal.targetDate).toLocaleDateString() : ""}</p></div>
          <div className="flex items-center gap-2">{payload && payload.learning.paths.length > 1 && <select value={goalId} onChange={event => setGoalId(event.target.value)} className="max-w-[220px] rounded-xl border border-[var(--line)] bg-[var(--app-bg)] px-3 py-2.5 text-xs">{payload.learning.paths.map(path => <option key={path.goal.id} value={path.goal.id}>{path.goal.targetRole}{path.goal.targetCompany ? " · " + path.goal.targetCompany : ""}</option>)}</select>}<button type="button" onClick={() => void load()} disabled={loading} className="rounded-xl border border-[var(--line)] p-2.5 text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}/></button></div>
        </div>
        {!loading && !current && <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] p-4"><p className="text-xs text-[var(--muted)]">Create an active career goal to connect your skill assessments, learning roadmap and practice history.</p><a href="/dashboard" className="mt-3 inline-flex text-xs text-[#c5f36a]">Create a career goal <ArrowUpRight className="ml-1 h-3 w-3"/></a></div>}
        {current && <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <Metric label="Roadmap progress" value={progressPercent + "%"} note={current.progress.completedTasks + " of " + current.progress.totalTasks + " marked complete"}/>
          <Metric label="Skills assessed" value={signals.assessed} note="Recorded self-assessments"/>
          <Metric label="Approved evidence" value={signals.evidence} note="Claims matched to this goal"/>
          <Metric label="Practice reflections" value={signals.practiceEvaluated} note="Learner self-evaluations"/>
        </div>}
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-semibold tracking-[0.18em] text-cyan-200">THE APEX WORKFLOW</p><h2 className="mt-1 text-lg font-semibold">Six connected stages</h2></div><p className="text-[10px] text-[var(--muted)]">Each stage opens its dedicated workspace</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage,index) => <a key={stage.id} href={stage.href} className="group rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 transition hover:border-cyan-200/30 hover:bg-white/[0.035]">
            <div className="flex items-center justify-between"><span className="text-[10px] font-semibold tracking-[0.15em] text-cyan-200">{stage.number} / 06</span><stage.icon className="h-4 w-4 text-[var(--muted)] group-hover:text-cyan-200"/></div>
            <h3 className="mt-3 text-sm font-semibold">{stage.title}</h3><p className="mt-1 text-xs leading-5 text-[var(--muted)]">{stage.detail}</p>
            <p className="mt-3 inline-flex items-center gap-1 text-[10px] text-[var(--muted)] group-hover:text-[var(--text)]">Open workspace <ArrowUpRight className="h-3 w-3"/></p>
            {index < stages.length - 1 && <span className="sr-only">Next stage follows</span>}
          </a>)}
        </div>
      </section>

      {payload && current && <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold tracking-[0.16em] text-[#c5f36a]">PERSONALISED EXECUTION</p><h2 className="mt-1 text-lg font-semibold">Next learning step</h2></div><a href="/features/career-command-center" className="text-[10px] text-[#c5f36a]">Full learning path ↗</a></div>
          {nextStep ? <div className="mt-4 rounded-2xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.04] p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#c5f36a]/10 px-2 py-1 text-[9px] text-[#dff6ae]">{nextStep.phase}</span>{nextStep.evidenceBacked && <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] text-emerald-200">Approved evidence linked</span>}</div><h3 className="mt-3 text-sm font-semibold">{nextStep.title}</h3><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{nextStep.reason}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] text-[var(--muted)]">{nextStep.skillKey} · {nextStep.taskPractice.sessions} linked sessions · {nextStep.evaluation.count} reflections</span><a href={nextStep.module} className="inline-flex items-center gap-1 rounded-xl bg-[#c5f36a] px-3 py-2 text-[10px] font-semibold text-[#100b19]">Practise this <ArrowRight className="h-3 w-3"/></a></div></div> : <p className="mt-4 text-xs text-[var(--muted)]">No incomplete learning steps are currently available for this goal.</p>}
          <div className="mt-5 flex items-center justify-between text-[10px] text-[var(--muted)]"><span>Roadmap completion</span><span>{progressPercent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#c5f36a]" style={{width: progressPercent + "%"}}/></div>
        </section>

        <section className="rounded-3xl border border-cyan-300/15 bg-[var(--panel)] p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold tracking-[0.16em] text-cyan-200">DAILY CAREER STRATEGIST</p><h2 className="mt-1 text-lg font-semibold">Priority shortlist</h2></div><a href="/features/career-command-center" className="text-[10px] text-cyan-200">Review plan ↗</a></div>
          <p className="mt-1 text-[10px] text-[var(--muted)]">{planItems.length} relevant items · about {planMinutes} minutes of suggested effort</p>
          <div className="mt-4 space-y-3">{planItems.length ? planItems.map(item => <div key={item.id} className="rounded-xl border border-[var(--line)] p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium">{item.title}</p><span className={"shrink-0 text-[9px] " + (item.urgency === "urgent" ? "text-rose-300" : item.urgency === "soon" ? "text-amber-200" : "text-[var(--muted)]")}>{item.urgency}</span></div><p className="mt-1 text-[10px] text-[var(--muted)]">{item.sourceLabel} · {item.estimatedMinutes} min</p>{item.evidence && <button type="button" onClick={() => setExpandedPlan(expandedPlan === item.id ? null : item.id)} className="mt-2 text-[10px] text-cyan-200">View supporting evidence</button>}{expandedPlan === item.id && item.evidence && <blockquote className="mt-2 border-l-2 border-cyan-300/30 pl-3 text-[10px] leading-5 text-[var(--muted)]">{item.evidence.excerpt}<a href={item.evidence.url} target="_blank" rel="noreferrer" className="mt-1 block text-cyan-200">{item.evidence.title} ↗</a></blockquote>}</div>) : <p className="text-xs text-[var(--muted)]">No matching priority items are available right now. Open the strategist to review your full plan.</p>}</div>
          <p className="mt-4 text-[9px] leading-5 text-[var(--muted)]">Suggestions are not saved or executed by this page. Review and explicitly accept actions in the Career Command Center.</p>
        </section>
      </div>}

      {payload && <section className="mt-5 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
        <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-300"/><h2 className="text-sm font-semibold">Seven-day activity review</h2></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Metric label="Practice sessions" value={payload.plan.weeklyReview.practiceSessions} note="Started in last 7 days"/>
          <Metric label="Timeline actions" value={payload.plan.weeklyReview.completedTimelineEvents} note="Marked complete"/>
          <Metric label="Roadmap tasks" value={payload.plan.weeklyReview.completedRoadmapTasks} note="Marked complete"/>
          <Metric label="Job prep tasks" value={payload.plan.weeklyReview.completedJobPreparationTasks} note="Marked complete"/>
          <Metric label="Recommendations" value={payload.plan.weeklyReview.completedRecommendations} note="Marked complete"/>
        </div>
        <p className="mt-3 text-[9px] text-[var(--muted)]">Activity counts are based on saved records and user-marked completion, not verified mastery or hiring outcomes.</p>
      </section>}

      <section className="mt-5 rounded-3xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.035] p-5 sm:p-6">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#c5f36a]"/><h2 className="text-sm font-semibold">Ask Career Copilot to connect the signals</h2></div>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--muted)]">Discuss your current direction, next learning step, approved company evidence and recent activity. Sharing saved career context remains off until you explicitly enable it for that message.</p>
        <a href={"/features/agent-workbench?skill=career-copilot&prompt=" + encodeURIComponent("Help me connect my saved career goal, approved employer evidence, learning roadmap and recent activity into a manageable next-step strategy. Explain the saved record behind each recommendation. Do not predict hiring outcomes.")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#c5f36a] px-4 py-2.5 text-xs font-semibold text-[#100b19]">Open Career Copilot <ArrowUpRight className="h-3.5 w-3.5"/></a>
      </section>
      <p className="mt-5 text-[10px] leading-5 text-[var(--muted)]">APEX Operating System is an orchestration workspace over existing authenticated APIs. Career goals, skill ratings, practice records, evidence claims, action decisions and outcomes retain their original source and permissions. It does not create a readiness score, certify proficiency, predict employment, or make changes without your explicit action.</p>
    </section>
  </div></ApexWorkspaceShell>;
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-black/20 p-3"><p className="text-[9px] text-[var(--muted)]">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-[9px] text-[var(--muted)]">{note}</p></div>;
}

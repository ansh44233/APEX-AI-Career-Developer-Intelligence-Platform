"use client";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BarChart3, BriefcaseBusiness, CheckCircle2, Clock3, Compass, Layers3, RefreshCw, Scale, Target, Zap } from "lucide-react";

type Step = {
  id: string; title: string; description: string; skillKey: string; module: string;
  phase: string; status: string; priority: number; reason: string; evidenceBacked: boolean;
  latestSelfRating: number | null; taskPractice: { sessions: number; attempts: number };
  evaluation: { count: number; latestSelfRating: number | null; trend: string };
};
type GoalPath = {
  goal: { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null };
  progress: { totalTasks: number; completedTasks: number; inProgressTasks: number };
  nextSteps: Step[];
};
type LearningData = { paths: GoalPath[]; methodology: string; limits: string };
type StrategyKey = "balanced" | "interview" | "portfolio" | "fundamentals";
type Lane = "interview" | "build" | "fundamentals" | "career";
type Strategy = { key: StrategyKey; title: string; description: string; allocation: Record<Lane, number>; accent: string };
const strategies: Strategy[] = [
  { key: "balanced", title: "Balanced growth", description: "Keep technical practice, projects and fundamentals moving together.", allocation: { interview: 35, build: 25, fundamentals: 25, career: 15 }, accent: "violet" },
  { key: "interview", title: "Interview-first", description: "Put more of the available time into coding, interview and system-design practice.", allocation: { interview: 60, build: 15, fundamentals: 15, career: 10 }, accent: "cyan" },
  { key: "portfolio", title: "Portfolio-first", description: "Prioritise project explanation, design work and demonstrable engineering output.", allocation: { interview: 20, build: 50, fundamentals: 20, career: 10 }, accent: "emerald" },
  { key: "fundamentals", title: "Foundations-first", description: "Spend more time strengthening fundamentals before increasing interview intensity.", allocation: { interview: 20, build: 15, fundamentals: 55, career: 10 }, accent: "amber" },
];
const laneLabels: Record<Lane, string> = { interview: "Interview practice", build: "Projects & design", fundamentals: "Core fundamentals", career: "Career admin" };
function laneFor(step: Step): Lane {
  const href = step.module.toLowerCase();
  if (href.includes("interview") || href.includes("oa-arena") || href.includes("question-bank") || href.includes("mock-interview")) return "interview";
  if (href.includes("project-defense") || href.includes("system-design")) return "build";
  return "fundamentals";
}
function effortFor(lane: Lane) { return lane === "build" ? 4 : lane === "interview" ? 3 : lane === "fundamentals" ? 2.5 : 1; }

export default function CareerSimulationPage() {
  const [data, setData] = useState<LearningData | null>(null);
  const [goalId, setGoalId] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [horizonWeeks, setHorizonWeeks] = useState(8);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyKey>("balanced");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/learning-path", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load your saved career roadmap.");
      setData(payload);
      setGoalId(current => current && payload.paths.some((path: GoalPath) => path.goal.id === current) ? current : payload.paths[0]?.goal.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Career simulation is unavailable.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const goal = data?.paths.find(path => path.goal.id === goalId) ?? data?.paths[0] ?? null;
  const simulations = useMemo(() => {
    if (!goal) return [];
    const availableHours = weeklyHours * horizonWeeks;
    const incomplete = Math.max(0, goal.progress.totalTasks - goal.progress.completedTasks);
    return strategies.map(strategy => {
      const laneHours = Object.fromEntries((Object.keys(strategy.allocation) as Lane[]).map(lane => [lane, availableHours * strategy.allocation[lane] / 100])) as Record<Lane, number>;
      const ranked = [...goal.nextSteps].sort((a, b) => {
        const aLane = laneFor(a), bLane = laneFor(b);
        const aScore = a.priority + strategy.allocation[aLane] * 0.45 + (a.evidenceBacked ? 12 : 0) + (a.status === "in_progress" ? 5 : 0);
        const bScore = b.priority + strategy.allocation[bLane] * 0.45 + (b.evidenceBacked ? 12 : 0) + (b.status === "in_progress" ? 5 : 0);
        return bScore - aScore;
      });
      const capacity = Math.floor(availableHours / 3);
      const focusTasks = ranked.slice(0, Math.min(ranked.length, Math.max(1, Math.ceil(capacity / Math.max(1, ranked.length ? Math.min(3, ranked.length) : 1)))));
      const estimatedTaskHours = focusTasks.reduce((sum, task) => sum + effortFor(laneFor(task)), 0);
      const workloadFit = availableHours <= 0 ? 0 : Math.min(100, Math.round(availableHours / Math.max(1, estimatedTaskHours) * 100));
      return { ...strategy, laneHours, focusTasks: focusTasks.slice(0, 4), availableHours, incomplete, estimatedTaskHours, workloadFit };
    });
  }, [goal, weeklyHours, horizonWeeks]);

  const savePlan = useCallback(async () => {
    const simulation = simulations.find(item => item.key === selectedStrategy);
    if (!goal || !simulation || simulation.focusTasks.length === 0) return;
    setSaving(true); setError(""); setNotice("");
    let saved = 0;
    try {
      for (const task of simulation.focusTasks.slice(0, 4)) {
        const response = await fetch("/api/intelligence/recommendation-actions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceKey: "skill-simulation-" + goal.goal.id + "-" + simulation.key + "-" + task.id,
            title: "Simulation plan · " + task.title,
            reason: simulation.title + " · " + task.reason + " Suggested allocation: " + weeklyHours + " hours/week for " + horizonWeeks + " weeks. This is a chosen scenario, not an outcome prediction.",
            href: task.module, basis: "simulation", action: "accepted", goalId: goal.goal.id,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Could not save the selected simulation plan.");
        saved += 1;
      }
      setNotice(saved + " plan actions added to your Career Action Tracker.");
    } catch (cause) {
      setError((cause instanceof Error ? cause.message : "Could not save the plan.") + " " + saved + " action(s) saved before the interruption.");
    } finally { setSaving(false); }
  }, [goal, horizonWeeks, selectedStrategy, simulations, weeklyHours]);

  const chosen = simulations.find(item => item.key === selectedStrategy);

  return <ApexWorkspaceShell><main className="min-h-screen text-[var(--text)]">
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#c5f36a]"><Compass className="h-4 w-4"/> PHASE 43 · DECISION LAB</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Career Simulation <span className="text-[#c5f36a]">& Decision Lab.</span></h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Compare preparation strategies against your saved roadmap and available time. Explore workload trade-offs before choosing which actions to add to your tracker.</p>
      </div>

      <section className="mb-6 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
        <div className="flex items-center gap-2"><Target className="h-4 w-4 text-[#c5f36a]"/><h2 className="text-sm font-semibold">Set your simulation constraints</h2></div>
        {loading && <p className="mt-4 text-xs text-[var(--muted)]">Loading your saved career goals and preparation data…</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200">{notice}</p>}
        {!loading && data && data.paths.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] p-4"><p className="text-sm font-medium">No active career goal found</p><p className="mt-1 text-xs text-[var(--muted)]">Create a goal first so APEX can simulate a plan using your actual roadmap.</p><a href="/dashboard" className="mt-3 inline-flex text-xs text-[#c5f36a]">Create a career goal <ArrowUpRight className="ml-1 h-3 w-3"/></a></div>}
        {data && data.paths.length > 0 && <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-[11px] text-[var(--muted)] md:col-span-1">Career goal
            <select value={goalId} onChange={event => setGoalId(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-xs text-[var(--text)]">{data.paths.map(path => <option key={path.goal.id} value={path.goal.id}>{path.goal.targetRole}{path.goal.targetCompany ? " · " + path.goal.targetCompany : ""}</option>)}</select>
          </label>
          <label className="text-[11px] text-[var(--muted)]">Hours available per week <span className="float-right text-[#dff6ae]">{weeklyHours}h</span>
            <input type="range" min="2" max="30" step="1" value={weeklyHours} onChange={event => setWeeklyHours(Number(event.target.value))} className="mt-4 w-full accent-[#c5f36a]"/>
            <span className="mt-1 block text-[9px] text-[var(--muted)]">Use realistic time you can consistently protect.</span>
          </label>
          <label className="text-[11px] text-[var(--muted)]">Planning horizon <span className="float-right text-[#dff6ae]">{horizonWeeks} weeks</span>
            <input type="range" min="2" max="24" step="1" value={horizonWeeks} onChange={event => setHorizonWeeks(Number(event.target.value))} className="mt-4 w-full accent-[#c5f36a]"/>
            <span className="mt-1 block text-[9px] text-[var(--muted)]">{weeklyHours * horizonWeeks} total planning hours.</span>
          </label>
        </div>}
      </section>

      {goal && chosen && <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric icon={BriefcaseBusiness} label="Target" value={goal.goal.targetRole} note={goal.goal.targetCompany || "Company not specified"}/>
          <Metric icon={Layers3} label="Roadmap" value={goal.progress.completedTasks + "/" + goal.progress.totalTasks} note="Tasks marked complete by you"/>
          <Metric icon={Clock3} label="Time budget" value={(weeklyHours * horizonWeeks) + "h"} note={weeklyHours + "h/week · " + horizonWeeks + " weeks"}/>
        </section>

        <section>
          <div className="mb-4"><p className="text-[10px] font-semibold tracking-[0.18em] text-[#c5f36a]">COMPARE FOUR STRATEGIES</p><h2 className="mt-1 text-xl font-semibold">Same time budget. Different trade-offs.</h2><p className="mt-1 text-xs text-[var(--muted)]">Each scenario reallocates the same hours. The ranking is a planning heuristic, not a measure of likely hiring success.</p></div>
          <div className="grid gap-4 lg:grid-cols-2">
            {simulations.map(simulation => <button key={simulation.key} type="button" onClick={() => setSelectedStrategy(simulation.key)} className={"rounded-2xl border p-4 text-left transition " + (selectedStrategy === simulation.key ? "border-[#c5f36a]/40 bg-[#c5f36a]/[0.06]" : "border-[var(--line)] bg-[var(--panel)] hover:border-white/20")}>
              <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{simulation.title}</h3><p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">{simulation.description}</p></div>{selectedStrategy === simulation.key ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#dff6ae]"/> : <Scale className="h-5 w-5 shrink-0 text-[var(--muted)]"/>}</div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{(Object.keys(simulation.allocation) as Lane[]).map(lane => <div key={lane} className="rounded-lg bg-black/20 p-2"><p className="text-[9px] text-[var(--muted)]">{laneLabels[lane]}</p><p className="mt-1 text-sm font-semibold tabular-nums">{simulation.allocation[lane]}%</p><p className="text-[9px] text-[var(--muted)]">{simulation.laneHours[lane].toFixed(1)}h</p></div>)}</div>
              <p className="mt-3 text-[10px] text-[var(--muted)]">Illustrative focus capacity: about {Math.floor(simulation.availableHours / 3)} average task-blocks across the horizon · {simulation.focusTasks.length} roadmap suggestions in preview</p>
            </button>)}
          </div>
        </section>

        <section className="rounded-3xl border border-[#c5f36a]/15 bg-[var(--panel)] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-[0.18em] text-[#c5f36a]">SELECTED SCENARIO</p><h2 className="mt-1 text-xl font-semibold">{chosen.title}</h2><p className="mt-1 text-xs text-[var(--muted)]">{chosen.description}</p></div><button type="button" onClick={() => void savePlan()} disabled={saving || chosen.focusTasks.length === 0} className="rounded-xl bg-[#c5f36a] px-4 py-2.5 text-xs font-semibold text-[#100b19] disabled:opacity-50">{saving ? "Saving plan…" : "Add selected plan to tracker"}</button></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric icon={Clock3} label="Available hours" value={chosen.availableHours + "h"} note="Your stated time budget"/><Metric icon={BarChart3} label="Estimated task effort" value={chosen.estimatedTaskHours + "h"} note="Rough planning estimate"/><Metric icon={Zap} label="Roadmap remaining" value={chosen.incomplete} note="Saved tasks not marked complete"/></div>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">Suggested focus tasks</h3>
          {chosen.focusTasks.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-[var(--line)] p-4 text-xs text-[var(--muted)]">No incomplete roadmap suggestions were returned for this goal.</p> : <div className="mt-3 space-y-2">{chosen.focusTasks.map((task, index) => <article key={task.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-black/20 p-3"><div className="flex min-w-0 gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#c5f36a]/10 text-xs text-[#dff6ae]">{index + 1}</span><div><p className="text-xs font-medium text-[var(--text)]">{task.title}</p><p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">{task.reason}</p><p className="mt-1 text-[9px] text-[var(--muted)]">{task.phase} · {task.skillKey.replaceAll("_", " ")} · {effortFor(laneFor(task))}h illustrative estimate</p></div></div><a href={task.module} className="shrink-0 text-[#c5f36a]"><ArrowUpRight className="h-4 w-4"/></a></article>)}</div>}
          <p className="mt-4 text-[10px] leading-5 text-[var(--muted)]">Selecting this plan saves up to four goal-linked actions. It does not change roadmap task status, application stages, calendar events or your career goal. You can review or complete saved actions in the Career Action Tracker.</p>
        </section>
      </div>}
      <p className="mt-6 text-[10px] leading-5 text-[var(--muted)]">{data?.methodology} {data?.limits} Time estimates and scenario allocations are APEX planning assumptions. The simulator does not calculate hiring probability, salary, interview pass rates or guaranteed career outcomes.</p>
      <div className="mt-5 flex justify-end"><button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5"/> Refresh saved data</button></div>
    </section>
  </main></ApexWorkspaceShell>;
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Target; label: string; value: string | number; note: string }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-black/20 p-4"><div className="flex items-center gap-2 text-[10px] text-[var(--muted)]"><Icon className="h-3.5 w-3.5 text-[#c5f36a]"/>{label}</div><p className="mt-2 break-words text-lg font-semibold text-[var(--text)]">{value}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{note}</p></div>;
}

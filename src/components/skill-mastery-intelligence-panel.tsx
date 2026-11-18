"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw, Target, TrendingDown, TrendingUp } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Skill = {
  skillKey: string;
  roadmapTasks: number;
  completedTasks: number;
  openTasks: number;
  modules: string[];
  selfAssessment: { latestRating: number | null; assessedAt: string | null; recordedRatings: number; earliestRating: number | null; trend: string; history: Array<{ rating: number; assessedAt: string }> };
  practice: {
    evaluatedAttempts: number;
    latestRubricAverage: number | null;
    averageRubricAverage: number | null;
    trend: string;
    lastEvaluatedAt: string | null;
    rubricDimensions: Array<{ key: string; averageRating: number; evaluations: number }>;
    recurringImprovementThemes: Array<{ theme: string; occurrences: number }>;
    latestStrengths: string;
    latestImprovementAreas: string;
    latestNextAction: string;
    recommendations: string[];
    history: Array<{ rubricAverage: number | null; evaluatedAt: string; dimensions: Array<{ key: string; rating: number }> }>;
  };
};
type Goal = {
  goal: { id: string; targetRole: string; targetCompany: string | null };
  totals: { skillsTracked: number; assessedSkills: number; skillsWithEvaluations: number; evaluatedAttempts: number };
  skills: Skill[];
};
type Payload = { goals: Goal[]; methodology: string; limits: string };

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
}

export function SkillMasteryIntelligencePanel() {
  const { data: session, isPending } = authClient.useSession();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/skill-mastery", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load skill intelligence.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Skill intelligence is unavailable.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (session) void load();
    else setData(null);
  }, [session?.user.id, load]);

  if (isPending) return null;

  return <section className="rounded-3xl border border-fuchsia-300/15 bg-[#15111a] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-fuchsia-300"><Activity className="h-4 w-4"/> PHASE 38 · SKILL MASTERY INTELLIGENCE</p><h2 className="mt-2 text-xl font-semibold text-white">Understand your practice history</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">Compare goal-linked self-assessments with saved practice evaluations, review rubric patterns and spot repeated improvement notes.</p></div>
      {session && <button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 disabled:opacity-50"><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}/> Refresh</button>}
    </div>
    {!session && <p className="mt-4 rounded-xl border border-white/[0.07] p-4 text-xs text-zinc-400">Sign in to view skill histories from your saved goals and practice evaluations.</p>}
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 p-3 text-xs text-rose-200">{error}</p>}
    {session && loading && !data && <p className="mt-4 text-xs text-zinc-500">Reading saved skill and practice history…</p>}
    {session && data && data.goals.length === 0 && <p className="mt-4 rounded-xl border border-dashed border-white/10 p-4 text-xs text-zinc-500">Create an active career goal and link practice to its roadmap tasks to start building skill history.</p>}
    {session && data && data.goals.map(group => <article key={group.goal.id} className="mt-5 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-white">{group.goal.targetRole}</h3><p className="mt-1 text-[10px] text-zinc-500">{group.goal.targetCompany || "Company not specified"}</p></div><div className="flex flex-wrap gap-2 text-[9px] text-zinc-400"><span className="rounded-lg border border-white/10 px-2 py-1">{group.totals.assessedSkills}/{group.totals.skillsTracked} skills self-assessed</span><span className="rounded-lg border border-white/10 px-2 py-1">{group.totals.evaluatedAttempts} evaluated attempts</span></div></div>
      {group.skills.length === 0 ? <p className="mt-3 text-xs text-zinc-500">No roadmap skills found for this goal.</p> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{group.skills.map(skill => <div key={skill.skillKey} className="rounded-xl border border-white/[0.07] p-3">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="text-xs font-semibold text-zinc-200">{label(skill.skillKey)}</h4><p className="mt-1 text-[9px] text-zinc-600">{skill.completedTasks}/{skill.roadmapTasks} roadmap tasks completed · {skill.modules.map(label).join(", ")}</p></div><span className="rounded-md border border-white/10 px-2 py-1 text-[9px] text-zinc-400">{skill.selfAssessment.latestRating === null ? "Not assessed" : "Self-rating " + skill.selfAssessment.latestRating + "/5" + (skill.selfAssessment.earliestRating !== null && skill.selfAssessment.recordedRatings > 1 ? " · from " + skill.selfAssessment.earliestRating + "/5" : "")}</span></div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-zinc-400"><span>{skill.practice.evaluatedAttempts} evaluated attempts</span><span>{skill.practice.latestRubricAverage === null ? "No rubric rating" : "Latest " + skill.practice.latestRubricAverage.toFixed(2) + "/5"}</span>{skill.practice.trend === "higher_self_rating" ? <span className="inline-flex items-center gap-1 text-emerald-300"><TrendingUp className="h-3 w-3"/> Higher self-rating</span> : skill.practice.trend === "lower_self_rating" ? <span className="inline-flex items-center gap-1 text-amber-300"><TrendingDown className="h-3 w-3"/> Lower self-rating</span> : <span>{skill.practice.trend.replaceAll("_", " ")}</span>}</div>
        {skill.selfAssessment.recordedRatings > 1 && <p className="mt-2 text-[9px] text-zinc-500">Self-assessment history: {skill.selfAssessment.recordedRatings} entries · {skill.selfAssessment.trend.replaceAll("_", " ")}</p>}{(skill.selfAssessment.history.length > 0 || skill.practice.history.length > 0) && <details className="mt-3"><summary className="cursor-pointer text-[10px] text-zinc-400">View skill-specific timeline</summary><div className="mt-2 grid gap-3 sm:grid-cols-2"><div><p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Self-assessments</p>{skill.selfAssessment.history.map((item, index) => <p key={item.assessedAt + index} className="mt-1 text-[9px] text-zinc-500">{new Date(item.assessedAt).toLocaleDateString()} · {item.rating}/5</p>)}</div><div><p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Practice evaluations</p>{skill.practice.history.map((item, index) => <div key={item.evaluatedAt + index} className="mt-1 text-[9px] text-zinc-500">{new Date(item.evaluatedAt).toLocaleDateString()} · {item.rubricAverage === null ? "No average" : item.rubricAverage.toFixed(2) + "/5"}{item.dimensions.length > 0 ? " · " + item.dimensions.map(dimension => label(dimension.key) + " " + dimension.rating + "/5").join(", ") : ""}</div>)}</div></div></details>}{skill.practice.rubricDimensions.length > 0 && <div className="mt-3"><p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Rubric patterns</p><div className="mt-2 flex flex-wrap gap-1.5">{skill.practice.rubricDimensions.map(item => <span key={item.key} className="rounded-md bg-white/[0.04] px-2 py-1 text-[9px] text-zinc-400">{label(item.key)} · {item.averageRating.toFixed(1)}/5</span>)}</div></div>}
        {skill.practice.recurringImprovementThemes.length > 0 && <div className="mt-3"><p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Repeated improvement notes · exact text matches</p><ul className="mt-1 space-y-1">{skill.practice.recurringImprovementThemes.map(item => <li key={item.theme} className="text-[10px] text-amber-200/80">{item.theme} <span className="text-zinc-600">· {item.occurrences} mentions</span></li>)}</ul></div>}
        {skill.practice.recommendations.length > 0 && <div className="mt-3 rounded-lg border border-fuchsia-300/10 bg-fuchsia-300/[0.035] p-2"><p className="text-[9px] font-semibold uppercase tracking-wider text-fuchsia-200">Suggested next steps</p><ul className="mt-1 space-y-1">{skill.practice.recommendations.map((item, index) => <li key={index} className="text-[10px] leading-5 text-zinc-400">• {item}</li>)}</ul></div>}{(skill.practice.latestStrengths || skill.practice.latestImprovementAreas || skill.practice.latestNextAction) && <details className="mt-3"><summary className="cursor-pointer text-[10px] text-fuchsia-200">Latest saved reflection</summary><div className="mt-2 space-y-2 text-[10px] leading-5 text-zinc-400">{skill.practice.latestStrengths && <p><strong className="text-zinc-300">Strengths:</strong> {skill.practice.latestStrengths}</p>}{skill.practice.latestImprovementAreas && <p><strong className="text-zinc-300">Improve:</strong> {skill.practice.latestImprovementAreas}</p>}{skill.practice.latestNextAction && <p><strong className="text-zinc-300">Next action:</strong> {skill.practice.latestNextAction}</p>}</div></details>}
      </div>)}</div>}
    </article>)}
    <p className="mt-4 text-[10px] leading-5 text-zinc-600">{data?.methodology} {data?.limits} Self-ratings and rubric scores are reflective signals, not verified mastery or job-readiness measurements.</p>
  </section>;
}

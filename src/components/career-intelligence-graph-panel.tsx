"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, GitBranch, RefreshCw, ShieldCheck, Target } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type GraphClaim = {
  id: string; claimType: string; claimText: string; supportingExcerpt: string;
  mapping: { skill: string; module: string };
  capture: { sourceTitle: string; sourceUrl: string; retrievedAt: string; contentHash: string };
};
type GraphSkill = { skillKey: string; assessment: { rating: number; assessedAt: string; source: string } | null; roadmap: { tasks: number; completed: number; open: number }; practice: { evaluatedAttempts: number; latestRubricAverage: number | null; rubricDimensions: Array<{ key: string; average: number; count: number }> }; modules: string[] };
type GraphGoal = {
  goal: { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null };
  nodes: {
    company: { name: string; matchedApprovedClaims: number } | null;
    role: string;
    claims: GraphClaim[];
    skills: GraphSkill[];
    practice: { sessions: number; attempts: number; modules: string[] };
    roadmap: { total: number; completed: number; inProgress: number; tasks: Array<{ id: string; title: string; skillKey: string; module: string; status: string; evidenceClaimId: string | null }> };
    applications: { total: number; byStatus: Record<string, number>; preparation: { total: number; completed: number; inProgress: number; todo: number }; items: Array<{ id: string; company: string; role: string; status: string; updatedAt: string; preparationTasks: number; timelineEvents: number }> };
    recommendations: { total: number; byStatus: Record<string, number>; next: Array<{ id: string; title: string; reason: string; href: string; status: string; dueAt: string | null; jobId: string | null; roadmapTaskId: string | null }> };
  };
};
type GraphPayload = { goals: GraphGoal[]; methodology: { links: string; mapping: string; limits: string } };

export function CareerIntelligenceGraphPanel() {
  const { data: session, isPending } = authClient.useSession();
  const [data, setData] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/graph", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load career intelligence graph.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load career intelligence graph.");
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (session) void load();
    else setData(null);
  }, [session?.user.id]);

  if (isPending) return null;

  return <section className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.07] to-transparent p-5">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300"><GitBranch className="h-3 w-3"/> Phase 39 · Unified career graph</p>
        <h2 className="text-lg font-semibold text-white">Career Intelligence Graph</h2>
        <p className="mt-1 text-xs text-zinc-500">Connect approved company evidence, skill histories, task-linked practice, applications and tracked recommendations.</p>
      </div>
      {session && <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh career intelligence graph" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}/></button>}
    </div>
    {!session && <p className="rounded-xl border border-white/[0.07] p-4 text-xs text-zinc-400">Sign in to connect your saved career data.</p>}
    {error && <p role="alert" className="mb-3 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">{error}</p>}
    {session && data && data.goals.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-5 text-center"><Target className="mx-auto h-5 w-5 text-zinc-500"/><p className="mt-2 text-sm text-zinc-300">Add an active career goal to build your graph.</p><a href="/dashboard" className="mt-2 inline-flex text-xs text-violet-200 underline">Manage career goals</a></div>}
    {data?.goals.map(({ goal, nodes }) => <article key={goal.id} className="mb-4 last:mb-0 rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-sm font-semibold text-white">{goal.targetRole}</h3><p className="mt-1 text-xs text-zinc-500">{goal.targetCompany ?? "No target company selected"}</p></div>
        <span className="rounded-lg border border-violet-300/15 px-2 py-1 text-[10px] text-violet-200">{nodes.roadmap.completed}/{nodes.roadmap.total} roadmap tasks complete</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <div className="rounded-lg bg-white/[0.035] p-3"><p className="text-[9px] uppercase tracking-wider text-zinc-500">Approved claims</p><p className="mt-1 text-lg font-semibold text-white">{nodes.claims.length}</p></div>
        <div className="rounded-lg bg-white/[0.035] p-3"><p className="text-[9px] uppercase tracking-wider text-zinc-500">Self-assessed skills</p><p className="mt-1 text-lg font-semibold text-white">{nodes.skills.length}</p></div>
        <div className="rounded-lg bg-white/[0.035] p-3"><p className="text-[9px] uppercase tracking-wider text-zinc-500">Goal-linked sessions</p><p className="mt-1 text-lg font-semibold text-white">{nodes.practice.sessions}</p></div>
        <div className="rounded-lg bg-white/[0.035] p-3"><p className="text-[9px] uppercase tracking-wider text-zinc-500">Saved attempts</p><p className="mt-1 text-lg font-semibold text-white">{nodes.practice.attempts}</p></div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-200"><ShieldCheck className="h-3 w-3"/> Company → evidence → practice</p>
          {nodes.claims.length === 0 ? <p className="mt-2 text-[11px] leading-5 text-zinc-500">No moderator-approved claims match this exact company and role yet. Browse Company Intel or continue with the general role roadmap.</p> : <div className="mt-2 space-y-2">{nodes.claims.slice(0, 4).map((claim) => <div key={claim.id} className="rounded-lg border border-emerald-300/10 p-3"><p className="text-[11px] font-medium text-zinc-200">{claim.claimText}</p><p className="mt-1 text-[9px] text-emerald-200/70">{claim.claimType === "explicit_requirement" ? "Explicit requirement" : "Employer guidance"} · Suggested skill: {claim.mapping.skill}</p><blockquote className="mt-2 border-l border-white/10 pl-2 text-[10px] leading-5 text-zinc-500">{claim.supportingExcerpt}</blockquote><a href={claim.mapping.module} className="mt-2 inline-flex items-center gap-1 text-[10px] text-violet-200 underline">Practise mapped topic <ArrowUpRight className="h-3 w-3"/></a><span className="mx-2 text-zinc-700">·</span><a href={claim.capture.sourceUrl} target="_blank" rel="noreferrer" className="text-[10px] text-zinc-400 underline">Source</a></div>)}</div>}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200">Skills → activity → roadmap</p>
          {nodes.skills.length === 0 ? <p className="mt-2 text-[11px] text-zinc-500">No roadmap or assessment skills recorded yet.</p> : <div className="mt-2 space-y-2">{nodes.skills.slice(0, 10).map((skill) => <div key={skill.skillKey} className="rounded-lg border border-white/[0.07] p-2.5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-medium text-zinc-200">{skill.skillKey.replaceAll("_", " ")}</span><span className="text-[9px] text-zinc-500">{skill.assessment ? "Self-rating " + skill.assessment.rating + "/5" + (skill.assessment.source === "profile" ? " · profile" : "") : "Not assessed"}</span></div><p className="mt-1 text-[9px] text-zinc-500">{skill.roadmap.completed}/{skill.roadmap.tasks} roadmap tasks · {skill.practice.evaluatedAttempts} evaluated attempts · {skill.practice.latestRubricAverage === null ? "No rubric rating" : "Latest reflection " + skill.practice.latestRubricAverage.toFixed(1) + "/5"}</p>{skill.practice.rubricDimensions.length > 0 && <p className="mt-1 text-[9px] text-zinc-600">Rubric: {skill.practice.rubricDimensions.slice(0, 3).map(item => item.key.replaceAll("_", " ") + " " + item.average.toFixed(1) + "/5").join(" · ")}</p>}</div>)}</div>}
          <div className="mt-3 rounded-lg border border-white/[0.07] p-3"><p className="text-[10px] text-zinc-400">Practice modules linked to this goal</p><p className="mt-1 text-[11px] text-zinc-200">{nodes.practice.modules.length ? nodes.practice.modules.join(" · ") : "No goal-linked practice modules yet"}</p><p className="mt-3 text-[10px] text-zinc-400">Next roadmap tasks</p>{nodes.roadmap.tasks.filter((task) => task.status !== "completed").slice(0, 3).map((task) => <a key={task.id} href={task.module} className="mt-2 flex items-center justify-between gap-2 text-[10px] text-violet-200 hover:text-white"><span>{task.title}</span><ArrowUpRight className="h-3 w-3 shrink-0"/></a>)}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/[0.07] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200">Applications → preparation</p>
          <p className="mt-1 text-lg font-semibold text-white">{nodes.applications.total} linked applications</p>
          <p className="mt-1 text-[10px] text-zinc-500">{nodes.applications.preparation.completed}/{nodes.applications.preparation.total} job-preparation tasks completed · {nodes.applications.preparation.todo} todo</p>
          {nodes.applications.items.length > 0 ? <div className="mt-2 space-y-2">{nodes.applications.items.slice(0, 4).map(job => <a key={job.id} href={"/features/job-preparation?jobId=" + job.id} className="flex items-center justify-between gap-2 rounded-md bg-white/[0.03] p-2 text-[10px] text-zinc-300"><span>{job.company} · {job.role}<span className="block text-[9px] text-zinc-600">{job.status} · {job.preparationTasks} prep tasks · {job.timelineEvents} timeline events</span></span><ArrowUpRight className="h-3 w-3 shrink-0"/></a>)}</div> : <p className="mt-2 text-[10px] text-zinc-600">No job applications explicitly linked to this goal.</p>}
        </div>
        <div className="rounded-lg border border-white/[0.07] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200">Recommendations → follow-through</p>
          <p className="mt-1 text-lg font-semibold text-white">{nodes.recommendations.total} tracked actions</p>
          <p className="mt-1 text-[10px] text-zinc-500">{Object.entries(nodes.recommendations.byStatus).map(([status, count]) => status + ": " + count).join(" · ") || "No tracked actions yet"}</p>
          {nodes.recommendations.next.length > 0 ? <div className="mt-2 space-y-2">{nodes.recommendations.next.map(action => <a key={action.id} href={action.href} className="block rounded-md bg-white/[0.03] p-2 text-[10px] text-zinc-300">{action.title}<span className="mt-0.5 block text-[9px] text-zinc-600">{action.status}{action.dueAt ? " · due " + new Date(action.dueAt).toLocaleDateString() : ""} · {action.reason}</span></a>)}</div> : <p className="mt-2 text-[10px] text-zinc-600">No accepted or deferred recommendations are currently open.</p>}
        </div>
      </div>
    </article>)}
    {session && loading && !data && <p className="text-xs text-zinc-500">Building your career graph…</p>}
    {data && <p className="mt-4 text-[10px] leading-5 text-zinc-600">{data.methodology.links} {data.methodology.mapping} {data.methodology.limits}</p>}
  </section>;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { BrainCircuit, RefreshCw, Target, TrendingUp, BriefcaseBusiness, Activity } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Memory = {
  generatedAt: string;
  profile: { activeGoals: number; totalGoals: number; savedApplications: number; practiceSessions: number; savedAttempts: number; assessedSkills: number; upcomingTimelineActions: number; overdueTimelineActions: number };
  goals: Array<{
    id: string; targetRole: string; targetCompany: string | null; status: string; targetDate: string | null;
    linkedPractice: { sessions: number; attempts: number; modules: string[] };
    selfAssessments: Array<{ skillKey: string; rating: number }>;
    applications: { total: number; byStatus: Record<string, number> };
    roadmap: { total: number; completed: number; completionPercent: number | null };
  }>;
  skills: Array<{ skillKey: string; latestRating: number; previousRating: number | null; change: string; assessedAt: string }>;
  applicationPipeline: Record<string, number>;
  practiceByModule: Array<{ module: string; sessions: number }>;
  recentApplications: Array<{ id: string; company: string; role: string; status: string; updatedAt: string; preparationTasks: number; timelineEvents: number }>;
  methodology: { source: string; privacy: string; limits: string };
};

export function CareerMemoryPanel() {
  const { data: session, isPending } = authClient.useSession();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/career-memory", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not reconstruct career memory.");
      setMemory(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load career memory.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (session) void load(); else setMemory(null); }, [session?.user.id, load]);
  if (isPending) return null;

  return <section className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-5">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><p className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300"><BrainCircuit className="h-3.5 w-3.5"/> Phase 30 · Persistent profile</p><h2 className="text-lg font-semibold text-white">Career Memory</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">A structured snapshot reconstructed from your saved APEX records, so your goals, skills and career activity can be understood together.</p></div>
      {session && <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh career memory" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}/></button>}
    </div>
    {!session && <p className="rounded-xl border border-white/10 p-4 text-xs text-zinc-400">Sign in to view your private career memory.</p>}
    {error && <p role="alert" className="mb-3 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
    {session && loading && !memory && <p className="text-xs text-zinc-500">Reconstructing your saved career profile…</p>}
    {memory && <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Target} label="Active goals" value={memory.profile.activeGoals}/>
        <Metric icon={BriefcaseBusiness} label="Applications" value={memory.profile.savedApplications}/>
        <Metric icon={Activity} label="Practice sessions" value={memory.profile.practiceSessions}/>
        <Metric icon={TrendingUp} label="Assessed skills" value={memory.profile.assessedSkills}/>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <h3 className="text-xs font-semibold text-zinc-200">Goal memory</h3>
          {memory.goals.length === 0 ? <p className="mt-2 text-xs text-zinc-500">Create a career goal to connect practice and preparation records.</p> : <div className="mt-3 space-y-3">{memory.goals.slice(0, 5).map(goal => <article key={goal.id} className="rounded-lg border border-white/[0.06] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-medium text-white">{goal.targetRole}</p><p className="mt-1 text-[10px] text-zinc-500">{goal.targetCompany || "No target company"} · {goal.status}</p></div><span className="text-[10px] text-violet-200">{goal.roadmap.completed}/{goal.roadmap.total} roadmap tasks</span></div>
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-zinc-400"><span>{goal.linkedPractice.sessions} linked sessions</span><span>{goal.linkedPractice.attempts} attempts</span><span>{goal.applications.total} linked jobs</span></div>
            {goal.selfAssessments.length > 0 && <p className="mt-2 text-[10px] leading-5 text-zinc-500">Self-ratings: {goal.selfAssessments.slice(0, 5).map(item => item.skillKey.replaceAll("_", " ") + " " + item.rating + "/5").join(" · ")}</p>}
          </article>)}</div>}
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <h3 className="text-xs font-semibold text-zinc-200">Skill history</h3>
          {memory.skills.length === 0 ? <p className="mt-2 text-xs text-zinc-500">No skill self-assessments recorded yet.</p> : <div className="mt-3 space-y-2">{memory.skills.slice(0, 10).map(skill => <div key={skill.skillKey} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2"><span className="text-[11px] text-zinc-300">{skill.skillKey.replaceAll("_", " ")}</span><span className="text-[10px] tabular-nums text-zinc-400">{skill.previousRating === null ? "First rating" : skill.previousRating + " → " + skill.latestRating} · {skill.latestRating}/5</span></div>)}</div>}
          <p className="mt-3 text-[10px] leading-5 text-zinc-600">A change reflects recorded self-ratings only, not independently measured skill improvement.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] p-4"><h3 className="text-xs font-semibold text-zinc-200">Practice by module</h3>{memory.practiceByModule.length ? memory.practiceByModule.slice(0, 6).map(item => <p key={item.module} className="mt-2 flex justify-between text-[10px] text-zinc-400"><span>{item.module.replaceAll("_", " ")}</span><span>{item.sessions}</span></p>) : <p className="mt-2 text-xs text-zinc-500">No saved practice sessions yet.</p>}</div>
        <div className="rounded-xl border border-white/[0.07] p-4"><h3 className="text-xs font-semibold text-zinc-200">Career follow-through</h3><p className="mt-2 text-xs text-zinc-400">{memory.profile.upcomingTimelineActions} upcoming · {memory.profile.overdueTimelineActions} overdue timeline actions</p><p className="mt-2 text-xs text-zinc-400">{memory.profile.savedAttempts} saved practice attempts · {memory.profile.totalGoals} total goals</p><a href="/features/career-command-center" className="mt-3 inline-flex text-[10px] text-violet-200 underline">Open Career Command Center ↗</a></div>
      </div>
      <details className="mt-4 rounded-lg border border-white/[0.06] p-3"><summary className="cursor-pointer text-[10px] font-semibold text-zinc-400">How this memory is built and what it excludes</summary><p className="mt-2 text-[10px] leading-5 text-zinc-500">{memory.methodology.source} {memory.methodology.privacy} {memory.methodology.limits}</p></details>
      <p className="mt-3 text-[9px] text-zinc-600">Snapshot generated {new Date(memory.generatedAt).toLocaleString()} · refreshed from saved records on request/page load.</p>
    </>}
  </section>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: number }) {
  return <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><div className="flex items-center justify-between"><p className="text-[10px] text-zinc-500">{label}</p><Icon className="h-3.5 w-3.5 text-violet-300"/></div><p className="mt-2 text-xl font-semibold tabular-nums text-white">{value}</p></div>;
}

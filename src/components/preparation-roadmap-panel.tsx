"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpenCheck, RefreshCw, Route } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type RoadmapTask = {
  id: string; goalId: string; taskKey: string; title: string; description: string;
  skillKey: string; module: string; phase: string; sortOrder: number;
  status: "todo" | "in_progress" | "completed";
  evidenceClaim?: { id: string; company: string; role: string; claimType: string; claimText: string; supportingExcerpt: string; capture: { sourceTitle: string; sourceUrl: string; retrievedAt: string; contentHash: string } } | null;
};
type GoalRoadmap = {
  goal: { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null };
  tasks: RoadmapTask[];
  progress: { total: number; completed: number; inProgress: number; percent: number };
};
type Payload = { goals: GoalRoadmap[]; methodology: string };

export function PreparationRoadmapPanel() {
  const { data: session, isPending } = authClient.useSession();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/roadmap", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load preparation roadmap.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load preparation roadmap.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) void load();
    else setData(null);
  }, [session?.user.id]);

  async function setStatus(task: RoadmapTask, status: RoadmapTask["status"]) {
    setUpdating(task.id);
    setError("");
    try {
      const response = await fetch("/api/intelligence/roadmap/" + task.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not update task.");
      setData((current) => current ? {
        ...current,
        goals: current.goals.map((goal) => {
          if (goal.goal.id !== task.goalId) return goal;
          const tasks = goal.tasks.map((item) => item.id === task.id ? { ...item, status } : item);
          const completed = tasks.filter((item) => item.status === "completed").length;
          return { ...goal, tasks, progress: { total: tasks.length, completed, inProgress: tasks.filter((item) => item.status === "in_progress").length, percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0 } };
        }),
      } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update task.");
    } finally {
      setUpdating(null);
    }
  }

  if (isPending) return null;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c6ff3d]">Your next steps</p>
          <h2 className="text-lg font-semibold text-white">Preparation roadmap</h2>
          <p className="mt-1 text-xs text-zinc-500">A practical sequence for each active career goal. Exact company-and-role matches can add individually approved employer evidence tasks.</p>
        </div>
        {session && <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh roadmap" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}/></button>}
      </div>

      {!session && <div className="rounded-xl border border-white/[0.06] p-4"><p className="text-sm text-zinc-300">Sign in to generate and track your preparation roadmap.</p><a href="/sign-in" className="mt-3 inline-flex rounded-lg bg-[#c6ff3d] px-3 py-2 text-xs font-semibold text-white">Sign in</a></div>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}
      {session && data && data.goals.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-5 text-center"><Route className="mx-auto h-5 w-5 text-zinc-500"/><p className="mt-2 text-sm text-zinc-300">Add an active career goal to generate a preparation plan.</p></div>}
      {session && data && data.goals.map((goal) => <article key={goal.goal.id} className="mb-5 last:mb-0 rounded-xl border border-white/[0.07] bg-black/15 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="text-sm font-semibold text-white">{goal.goal.targetRole}</h3><p className="mt-1 text-xs text-zinc-500">{goal.goal.targetCompany || "Career goal"} · {goal.progress.completed}/{goal.progress.total} tasks completed</p></div>
          <p className="text-lg font-semibold text-[#d8ff83]">{goal.progress.percent}%</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[#c6ff3d] transition-all" style={{ width: goal.progress.percent + "%" }}/></div>
        <div className="mt-4 space-y-3">
          {goal.tasks.map((task) => <div key={task.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#c6ff3d]">{task.phase}</p><h4 className="mt-1 text-xs font-semibold text-zinc-200">{task.title}</h4><p className="mt-1 text-[11px] leading-5 text-zinc-500">{task.description}</p>{task.evidenceClaim && <div className="mt-3 rounded-lg border border-emerald-300/15 bg-emerald-300/[0.035] p-3"><p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200">Moderator-approved employer evidence · {task.evidenceClaim.claimType === "explicit_requirement" ? "Explicit requirement" : "Employer guidance"}</p><blockquote className="mt-2 border-l border-emerald-300/30 pl-3 text-[10px] leading-5 text-zinc-400">{task.evidenceClaim.supportingExcerpt}</blockquote><a href={task.evidenceClaim.capture.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[10px] text-emerald-200 underline underline-offset-4">Source: {task.evidenceClaim.capture.sourceTitle}</a><p className="mt-1 break-all text-[9px] text-zinc-600">Snapshot SHA-256 {task.evidenceClaim.capture.contentHash}</p></div>}</div>
              <select aria-label={"Status for " + task.title} disabled={updating === task.id} value={task.status} onChange={(event) => void setStatus(task, event.target.value as RoadmapTask["status"])} className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-[10px] text-zinc-300 disabled:opacity-50">
                <option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
              </select>
            </div>
            <a href={task.module + (task.module.includes("?") ? "&" : "?") + "taskId=" + encodeURIComponent(task.id)} className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-[#d8ff83] hover:text-white"><BookOpenCheck className="h-3 w-3"/> Open practice module <ArrowUpRight className="h-3 w-3"/></a>
          </div>)}
        </div>
      </article>)}
      {session && loading && !data && <p className="text-xs text-zinc-500">Preparing your roadmap…</p>}
      {session && !loading && !data && !error && <p className="text-xs text-zinc-500">Roadmap will appear when career goals are available.</p>}
      {data && <p className="mt-4 text-[10px] leading-4 text-zinc-600">{data.methodology}</p>}
    </section>
  );
}

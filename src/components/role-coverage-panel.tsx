"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, RefreshCw, Target } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Skill = { key: string; label: string; modules: string[]; rating: number | null; assessedAt: string | null; status: "assessed" | "not_assessed" };
type GoalCoverage = {
  goal: { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null };
  template: { id: string; label: string };
  skills: Skill[];
  totals: { requiredSkills: number; assessedSkills: number; notYetAssessed: number; assessmentCoveragePercent: number };
};
type Payload = { goals: GoalCoverage[]; methodology: { source: string; coverage: string; mapping: string; scope: string } };

export function RoleCoveragePanel() {
  const { data: session, isPending } = authClient.useSession();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/role-coverage", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load role coverage.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load role coverage.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) void load();
    else setData(null);
  }, [session?.user.id]);

  if (isPending) return null;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Role-aligned preparation</p>
          <h2 className="text-lg font-semibold text-white">Skill-to-role coverage</h2>
          <p className="mt-1 text-xs text-zinc-500">See which skills in a role template have a recorded self-assessment.</p>
        </div>
        {session && <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh role coverage" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></button>}
      </div>

      {!session && <div className="rounded-xl border border-white/[0.06] p-4"><p className="text-sm text-zinc-300">Sign in to map your recorded skills against saved career goals.</p><a href="/sign-in" className="mt-3 inline-flex rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white">Sign in</a></div>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}
      {session && data && data.goals.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-5 text-center"><BriefcaseBusiness className="mx-auto h-5 w-5 text-zinc-500"/><p className="mt-2 text-sm text-zinc-300">Add an active career goal to build your first role map.</p><p className="mt-1 text-xs text-zinc-500">Your goal title selects a built-in starting template.</p></div>}
      {session && data && data.goals.length > 0 && <div className="space-y-5">
        {data.goals.map((item) => <article key={item.goal.id} className="rounded-xl border border-white/[0.07] bg-black/15 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="text-sm font-semibold text-white">{item.goal.targetRole}</h3><p className="mt-1 text-xs text-zinc-500">{item.goal.targetCompany || item.template.label} · {item.totals.requiredSkills} template skills</p></div>
            <div className="text-right"><p className="text-xl font-semibold text-white">{item.totals.assessmentCoveragePercent}%</p><p className="text-[10px] text-zinc-500">assessment coverage</p></div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-violet-400" style={{ width: item.totals.assessmentCoveragePercent + "%" }}/></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {item.skills.map((skill) => <div key={skill.key} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
              <div className="min-w-0"><p className="truncate text-xs text-zinc-300">{skill.label}</p><p className="mt-1 text-[10px] text-zinc-600">{skill.status === "assessed" ? "Self-rated" : "Not assessed yet"}</p></div>
              <span className={skill.rating === null ? "shrink-0 text-xs text-zinc-600" : "shrink-0 text-xs font-semibold text-violet-200"}>{skill.rating === null ? "—" : skill.rating + "/5"}</span>
            </div>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(new Set(item.skills.flatMap((skill) => skill.modules))).map((href) => <a key={href} href={href} className="inline-flex items-center gap-1 rounded-lg border border-violet-300/15 px-2.5 py-1.5 text-[10px] font-medium text-violet-200 hover:bg-violet-400/10">{href.split("/").pop()?.replaceAll("-", " ")} <ArrowUpRight className="h-3 w-3"/></a>)}
            <a href="/features/readiness-engine" className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-400 hover:text-white"><Target className="h-3 w-3"/> Update skill ratings</a>
          </div>
        </article>)}
      </div>}
      {session && loading && !data && <p className="text-xs text-zinc-500">Building role maps from your saved goals…</p>}
      {session && !loading && !data && !error && <p className="text-xs text-zinc-500">Role coverage will appear when career goals are available.</p>}
      {data && <p className="mt-4 text-[10px] leading-4 text-zinc-600">{data.methodology.coverage} {data.methodology.mapping} {data.methodology.scope}</p>}
    </section>
  );
}

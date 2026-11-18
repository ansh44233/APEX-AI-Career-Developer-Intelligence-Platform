"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, BrainCircuit, RefreshCw, Target } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Overview = {
  generatedAt: string;
  methodology: { readinessScore: number | null; note: string; averageScoreNote: string };
  totals: {
    sessions: number;
    completedSessions: number;
    inProgressSessions: number;
    abandonedSessions: number;
    attempts: number;
    averageRecordedScore: number | null;
  };
  moduleBreakdown: { module: string; sessions: number }[];
  recentActivity: {
    id: string;
    module: string;
    title: string;
    status: string;
    startedAt: string;
    _count: { attempts: number };
  }[];
  skillAssessments: {
    skillKey: string;
    averageRating: number;
    assessmentCount: number;
    lastAssessedAt: string | null;
  }[];
};

function label(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ProgressAnalyticsPanel() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/overview", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load analytics.");
      setOverview(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) void loadOverview();
    else setOverview(null);
  }, [session?.user.id]);

  const daily = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return { key: date.toLocaleDateString(), name: date.toLocaleDateString(undefined, { weekday: "short" }), count: 0 };
    });
    for (const item of overview?.recentActivity ?? []) {
      const key = new Date(item.startedAt).toLocaleDateString();
      const day = days.find((entry) => entry.key === key);
      if (day) day.count += 1;
    }
    return days;
  }, [overview]);
  const maxDaily = Math.max(1, ...daily.map((day) => day.count));

  if (sessionPending) {
    return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-zinc-500">Checking your account…</div>;
  }

  if (!session) {
    return (
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white"><BarChart3 className="h-4 w-4 text-violet-300" /> Progress analytics</div>
        <p className="mt-2 text-sm text-zinc-500">Sign in to see your saved practice and skill-assessment trends.</p>
        <a href="/sign-in" className="mt-4 inline-flex rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white">Sign in to continue</a>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Measured from saved records</p>
          <h2 className="text-lg font-semibold text-white">Progress analytics</h2>
          <p className="mt-1 text-xs text-zinc-500">A descriptive view of your recorded activity, not an inferred ability score.</p>
        </div>
        <button type="button" onClick={() => void loadOverview()} disabled={loading} aria-label="Refresh analytics" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}

      {overview && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { name: "Practice sessions", value: overview.totals.sessions, icon: Activity },
              { name: "Completed", value: overview.totals.completedSessions, icon: Target },
              { name: "Saved attempts", value: overview.totals.attempts, icon: BarChart3 },
              { name: "Average recorded score", value: overview.totals.averageRecordedScore === null ? "—" : overview.totals.averageRecordedScore.toFixed(1), icon: BrainCircuit },
            ].map((stat) => (
              <div key={stat.name} className="rounded-xl border border-white/[0.07] bg-black/15 p-3">
                <div className="flex items-center justify-between text-[10px] text-zinc-500"><span>{stat.name}</span><stat.icon className="h-3.5 w-3.5 text-violet-300" /></div>
                <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4">
              <h3 className="text-xs font-semibold text-zinc-200">Sessions · last 7 days</h3>
              <div className="mt-5 flex h-32 items-end justify-between gap-2" role="img" aria-label="Bar chart showing saved practice sessions for the last seven days">
                {daily.map((day) => (
                  <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] tabular-nums text-zinc-400">{day.count}</span>
                    <div className="flex h-20 w-full items-end rounded-t-md bg-white/[0.04]">
                      <div className="w-full rounded-t-md bg-violet-400" style={{ height: (day.count / maxDaily * 100) + "%" }} />
                    </div>
                    <span className="text-[10px] text-zinc-500">{day.name}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-zinc-600">Counts are based on session start dates.</p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4">
              <h3 className="text-xs font-semibold text-zinc-200">Practice by module</h3>
              <div className="mt-4 space-y-3">
                {overview.moduleBreakdown.map((item) => {
                  const percentage = overview.totals.sessions ? item.sessions / overview.totals.sessions * 100 : 0;
                  return (
                    <div key={item.module}>
                      <div className="mb-1.5 flex justify-between gap-3 text-[11px]"><span className="text-zinc-400">{label(item.module)}</span><span className="text-zinc-300">{item.sessions}</span></div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-violet-400" style={{ width: percentage + "%" }} /></div>
                    </div>
                  );
                })}
                {overview.moduleBreakdown.length === 0 && <p className="text-xs text-zinc-500">No practice sessions recorded yet.</p>}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4 lg:col-span-2">
              <h3 className="text-xs font-semibold text-zinc-200">Skill assessment trends · current averages</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {overview.skillAssessments.map((skill) => (
                  <div key={skill.skillKey} className="rounded-lg border border-white/[0.06] p-3">
                    <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-zinc-300">{label(skill.skillKey)}</span><span className="text-xs font-semibold text-violet-200">{skill.averageRating.toFixed(1)}/5</span></div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-violet-400" style={{ width: (skill.averageRating / 5 * 100) + "%" }} /></div>
                    <p className="mt-2 text-[10px] text-zinc-600">{skill.assessmentCount} record{skill.assessmentCount === 1 ? "" : "s"}</p>
                  </div>
                ))}
                {overview.skillAssessments.length === 0 && <p className="text-xs text-zinc-500">No skill assessments recorded yet. Add one in Skill Assessments.</p>}
              </div>
            </div>
          </div>
          <p className="mt-4 text-[10px] leading-4 text-zinc-600">{overview.methodology.note} {overview.methodology.averageScoreNote}</p>
        </>
      )}
      {!overview && !loading && !error && <p className="text-xs text-zinc-500">Analytics will appear when your account has saved activity.</p>}
      {loading && !overview && <p className="text-xs text-zinc-500">Loading your analytics…</p>}
    </section>
  );
}

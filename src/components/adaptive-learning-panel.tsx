"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, RefreshCw, RotateCcw, TrendingDown, TrendingUp } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Recommendation = { id: string; type: string; title: string; prompt: string; module: string; reason: string; basis: string; priority: number };
type Trend = { module: string; prompt: string; attempts: number; lastPractisedAt: string; daysSinceLastPractice: number; scoreTrend: string; previousRecordedScore: number | null; latestRecordedScore: number | null; recordedScoreCount: number };
type Payload = { totals: { promptsTracked: number; promptsWithComparableScores: number; promptsWithLowerLatestScore: number; promptsDueForRevisit: number }; recommendations: Recommendation[]; scoreTrends: Trend[]; methodology: { scoreComparison: string; recency: string; limits: string } };

function moduleName(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AdaptiveLearningPanel() {
  const { data: session, isPending } = authClient.useSession();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/adaptive", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load adaptive learning.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load adaptive learning.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) void load();
    else setData(null);
  }, [session?.user.id]);

  if (isPending) return null;

  return <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Evidence-led practice</p><h2 className="text-lg font-semibold text-white">Adaptive Learning Engine</h2><p className="mt-1 text-xs text-zinc-500">Next steps based on saved scores and practice dates—not guessed ability.</p></div>
      {session && <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh adaptive learning" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></button>}
    </div>
    {!session && <div className="rounded-xl border border-white/[0.06] p-4"><p className="text-sm text-zinc-300">Sign in to get practice recommendations from your saved activity.</p><a href="/sign-in" className="mt-3 inline-flex rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white">Sign in</a></div>}
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}
    {session && data && <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[{label:"Prompts tracked",value:data.totals.promptsTracked},{label:"Comparable score pairs",value:data.totals.promptsWithComparableScores},{label:"Latest score lower",value:data.totals.promptsWithLowerLatestScore},{label:"Due for revisit",value:data.totals.promptsDueForRevisit}].map(item=><div key={item.label} className="rounded-xl border border-white/[0.06] bg-black/15 p-3"><p className="text-[10px] text-zinc-500">{item.label}</p><p className="mt-2 text-xl font-semibold text-white">{item.value}</p></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div><h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-zinc-200"><Activity className="h-4 w-4 text-violet-300"/> Suggested next steps</h3>
          {data.recommendations.length ? <ul className="space-y-2">{data.recommendations.map(item=><li key={item.id} className="rounded-xl border border-white/[0.06] bg-black/10 p-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-violet-200">{moduleName(item.module)} · {item.type}</span><ArrowUpRight className="h-3.5 w-3.5 text-zinc-500"/></div><p className="mt-2 text-xs font-semibold text-zinc-200">{item.title}</p><p className="mt-1 text-xs leading-5 text-zinc-400">{item.prompt}</p><p className="mt-2 text-[10px] leading-4 text-zinc-500">{item.reason}</p></li>)}</ul> : <div className="rounded-xl border border-white/[0.06] p-4 text-xs leading-5 text-zinc-500">No urgent prompt-level recommendation from the available records. Save more scored attempts or return to older prompts to build useful signals.</div>}
        </div>
        <div><h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-zinc-200"><TrendingUp className="h-4 w-4 text-violet-300"/> Recorded score changes</h3>
          {data.scoreTrends.length ? <ul className="space-y-2">{data.scoreTrends.slice(0,6).map((item,index)=><li key={item.module+item.prompt+index} className="rounded-xl border border-white/[0.06] bg-black/10 p-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] uppercase tracking-wider text-violet-200">{moduleName(item.module)}</span><span className="flex items-center gap-1 text-[10px] text-zinc-400">{item.scoreTrend==="down"?<TrendingDown className="h-3 w-3"/>:item.scoreTrend==="up"?<TrendingUp className="h-3 w-3"/>:<RotateCcw className="h-3 w-3"/>}{item.scoreTrend}</span></div><p className="mt-2 text-xs text-zinc-300">{item.prompt}</p><p className="mt-1 text-[10px] text-zinc-500">Previous: {item.previousRecordedScore} · Latest: {item.latestRecordedScore} · {item.recordedScoreCount} scored attempts</p></li>)}</ul> : <div className="rounded-xl border border-white/[0.06] p-4 text-xs leading-5 text-zinc-500">Score trends appear only after the same prompt has at least two explicitly scored attempts.</div>}
        </div>
      </div>
      <p className="mt-4 text-[10px] leading-4 text-zinc-600">{data.methodology.scoreComparison} {data.methodology.recency} {data.methodology.limits}</p>
    </>}
    {session && loading && !data && <p className="text-xs text-zinc-500">Building recommendations from your saved attempts…</p>}
    {session && !loading && !data && !error && <p className="text-xs text-zinc-500">Adaptive recommendations will appear when practice records are available.</p>}
  </section>;
}

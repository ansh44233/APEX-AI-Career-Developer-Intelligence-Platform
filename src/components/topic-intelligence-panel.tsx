"use client";

import { useEffect, useState } from "react";
import { BookOpen, RefreshCw, Repeat2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Topic = {
  module: string;
  moduleLabel: string;
  prompt: string;
  attempts: number;
  firstSeenAt: string;
  lastSeenAt: string;
  daysSinceLastAttempt: number;
  averageRecordedScore: number | null;
  recordedScoreCount: number;
};

type Payload = {
  generatedAt: string;
  totals: { attemptsAnalysed: number; distinctPromptTopics: number; repeatedTopics: number; topicsWithRecordedScores: number };
  topics: Topic[];
  methodology: { grouping: string; scoring: string; limits: string };
};

export function TopicIntelligencePanel() {
  const { data: session, isPending } = authClient.useSession();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence/topics", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load topic history.");
      setData(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load topic history.");
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
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Prompt-level history</p>
          <h2 className="text-lg font-semibold text-white">Topic intelligence</h2>
          <p className="mt-1 text-xs text-zinc-500">See which exact prompts you have revisited across practice sessions.</p>
        </div>
        {session && <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh topic intelligence" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></button>}
      </div>

      {!session && <div className="rounded-xl border border-white/[0.06] p-4"><p className="text-sm text-zinc-300">Sign in to build a personal topic timeline.</p><a href="/sign-in" className="mt-3 inline-flex rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white">Sign in</a></div>}
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}
      {session && data && <>
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Attempts analysed", value: data.totals.attemptsAnalysed },
            { label: "Distinct prompts", value: data.totals.distinctPromptTopics },
            { label: "Revisited prompts", value: data.totals.repeatedTopics },
            { label: "With saved scores", value: data.totals.topicsWithRecordedScores },
          ].map((item) => <div key={item.label} className="rounded-xl border border-white/[0.06] bg-black/15 p-3"><p className="text-[10px] text-zinc-500">{item.label}</p><p className="mt-2 text-xl font-semibold text-white">{item.value}</p></div>)}
        </div>
        {data.topics.length ? <ul className="space-y-2">{data.topics.slice(0, 8).map((topic) => <li key={topic.module + topic.prompt} className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-violet-200">{topic.moduleLabel}</span><span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">{topic.attempts > 1 && <Repeat2 className="h-3 w-3" />}{topic.attempts} attempt{topic.attempts === 1 ? "" : "s"}</span></div>
          <p className="mt-2 text-xs leading-5 text-zinc-200">{topic.prompt}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500"><span>Last practised {new Date(topic.lastSeenAt).toLocaleDateString()}</span><span>{topic.daysSinceLastAttempt} day(s) ago</span>{topic.averageRecordedScore !== null && <span>Recorded average: {topic.averageRecordedScore}</span>}</div>
        </li>)}</ul> : <div className="rounded-xl border border-white/[0.06] p-5 text-center"><BookOpen className="mx-auto h-5 w-5 text-violet-300" /><p className="mt-2 text-xs text-zinc-400">No saved attempts yet. Save an answer in Interview Lab or OA Arena to start your topic history.</p></div>}
        <p className="mt-4 text-[10px] leading-4 text-zinc-600">{data.methodology.grouping} {data.methodology.scoring} {data.methodology.limits}</p>
      </>}
      {session && loading && !data && <p className="text-xs text-zinc-500">Loading your prompt history…</p>}
      {session && !loading && !data && !error && <p className="text-xs text-zinc-500">Topic history will appear when saved attempts are available.</p>}
    </section>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowRight, BrainCircuit, Loader2, RefreshCw } from "lucide-react";

type QuestionInsight = {
  id: string;
  round: string;
  title: string;
  attempts: number;
  selfReviewedAttempts: number;
  averageSelfReview: number | null;
  lastPractisedAt: string | null;
};
type Insight = {
  sessionCount: number;
  totalAttempts: number;
  answeredPromptCount: number;
  totalPrompts: number;
  selfReviewedAttemptCount: number;
  questions: QuestionInsight[];
  roundCoverage: { round: string; answered: number; total: number }[];
  needsReview: QuestionInsight[];
  recommended: (QuestionInsight & { reason: string }) | null;
  methodology: { rating: string; coverage: string; limits: string };
};

export function InterviewIntelligencePanel({ goalId = "" }: { goalId?: string }) {
  const [data, setData] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = goalId ? `?goalId=${encodeURIComponent(goalId)}` : "";
      const response = await fetch(`/api/intelligence/interview-prep${query}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load interview intelligence.");
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load interview intelligence.");
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="rounded-3xl border border-violet-300/15 bg-[#111119] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-violet-200"><BrainCircuit className="h-4 w-4"/> ADAPTIVE INTERVIEW INTELLIGENCE</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Your next best practice</h2>
          <p className="mt-1 text-xs text-zinc-500">{goalId ? "Filtered to the selected career goal" : "Across your saved mock-interview sessions"}</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-40" aria-label="Refresh interview intelligence"><RefreshCw className="h-4 w-4"/></button>
      </div>

      {loading ? <div className="mt-6 flex items-center gap-2 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin"/> Analysing saved practice…</div> :
      error ? <p className="mt-5 text-sm text-rose-300">{error}</p> : data ? <>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Sessions", data.sessionCount],
            ["Saved answers", data.totalAttempts],
            ["Prompt coverage", `${data.answeredPromptCount}/${data.totalPrompts}`],
            ["Self-reviewed", data.selfReviewedAttemptCount],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums text-white">{value}</p></div>)}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {data.roundCoverage.map((round) => <div key={round.round} className="rounded-xl border border-white/[0.07] p-3">
            <div className="flex justify-between text-xs"><span className="text-zinc-300">{round.round}</span><span className="text-zinc-500">{round.answered}/{round.total}</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{ width: `${(round.answered / round.total) * 100}%` }}/></div>
          </div>)}
        </div>

        <div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-300/[0.04] p-4">
          <p className="text-[10px] font-semibold tracking-wider text-violet-200">RECOMMENDED NEXT</p>
          {data.recommended ? <>
            <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-white">{data.recommended.title}</span><span className="rounded-full bg-white/[0.07] px-2 py-1 text-[10px] text-zinc-400">{data.recommended.round}</span></div>
            <p className="mt-2 text-xs leading-5 text-zinc-400">{data.recommended.reason}</p>
            <p className="mt-2 text-[10px] text-zinc-500">{data.recommended.attempts} saved answer(s) · {data.recommended.averageSelfReview === null ? "No self-review rating" : `Average self-review ${data.recommended.averageSelfReview}/5`}</p>
          </> : <p className="mt-2 text-xs text-zinc-400">Start a mock interview to create your first saved practice signal.</p>}
        </div>

        <div className="mt-5">
          <p className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><Activity className="h-4 w-4 text-violet-300"/> Prompt history</p>
          <div className="mt-3 space-y-2">
            {data.questions.map((question) => <div key={question.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] px-3 py-2.5">
              <div><p className="text-xs font-medium text-zinc-200">{question.title}</p><p className="mt-1 text-[10px] text-zinc-500">{question.round} · {question.attempts} saved · {question.selfReviewedAttempts} rated</p></div>
              <span className="text-xs tabular-nums text-zinc-400">{question.averageSelfReview === null ? "—" : `${question.averageSelfReview}/5 self-review`}</span>
            </div>)}
          </div>
        </div>
        <p className="mt-4 text-[10px] leading-5 text-zinc-600">{data.methodology.rating} {data.methodology.limits}</p>
        <a href="/features/interview-prep" className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-violet-200 hover:text-white">Open interview preparation <ArrowRight className="h-3.5 w-3.5"/></a>
      </> : null}
    </section>
  );
}

"use client";

import { useState } from "react";

type Dimension = { key: string; label: string; rating: number; note: string };
type Props = { sessionId: string; attemptId: string; onSaved: () => void };

const initial: Dimension[] = [
  { key: "correctness", label: "Correctness / relevance", rating: 3, note: "" },
  { key: "reasoning", label: "Reasoning and explanation", rating: 3, note: "" },
  { key: "validation", label: "Examples, tests and edge cases", rating: 3, note: "" },
];

export function PracticeEvaluationForm({ sessionId, attemptId, onSaved }: Props) {
  const [rubric, setRubric] = useState(initial);
  const [strengths, setStrengths] = useState("");
  const [improvementAreas, setImprovementAreas] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/practice/sessions/" + encodeURIComponent(sessionId) + "/attempts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, rubric, strengths, improvementAreas, nextAction }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save evaluation.");
      setMessage("Self-evaluation saved.");
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save evaluation.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.035] p-3">
    <p className="text-[10px] font-semibold tracking-wider text-cyan-200">YOUR SELF-EVALUATION · 1–5</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      {rubric.map((item, index) => <label key={item.key} className="text-[10px] text-zinc-400">{item.label}<select value={item.rating} onChange={event => setRubric(current => current.map((entry, i) => i === index ? { ...entry, rating: Number(event.target.value) } : entry))} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#09090d] px-2 py-2 text-xs text-zinc-200">{[1,2,3,4,5].map(value => <option key={value} value={value}>{value}/5</option>)}</select></label>)}
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <label className="text-[10px] text-zinc-400">What went well<textarea value={strengths} onChange={event => setStrengths(event.target.value)} maxLength={2000} rows={2} className="mt-1 w-full rounded-lg border border-white/10 bg-[#09090d] p-2 text-xs text-zinc-200" placeholder="Record strengths…"/></label>
      <label className="text-[10px] text-zinc-400">What needs work<textarea value={improvementAreas} onChange={event => setImprovementAreas(event.target.value)} maxLength={2000} rows={2} className="mt-1 w-full rounded-lg border border-white/10 bg-[#09090d] p-2 text-xs text-zinc-200" placeholder="Record gaps or uncertainty…"/></label>
    </div>
    <label className="mt-2 block text-[10px] text-zinc-400">Next practice action<textarea value={nextAction} onChange={event => setNextAction(event.target.value)} maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border border-white/10 bg-[#09090d] p-2 text-xs text-zinc-200" placeholder="One concrete thing to practise next…"/></label>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-[10px] text-zinc-500">{message || "Ratings are your own reflection, not an automated grade."}</p><button type="button" onClick={() => void save()} disabled={saving} className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-semibold text-slate-950 disabled:opacity-50">{saving ? "Saving…" : "Save evaluation"}</button></div>
  </div>;
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { BrainCircuit, Plus, RefreshCw, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Assessment = {
  id: string;
  skillKey: string;
  rating: number;
  evidenceNote: string | null;
  assessedAt: string;
  goalId: string | null;
};

type Recommendation = {
  id: string;
  title: string;
  reason: string;
  href: string;
  basis: string;
};

const suggestedSkills = [
  "problem_solving", "communication", "system_design", "data_structures",
  "algorithms", "core_cs", "javascript", "typescript", "database_design",
  "react", "web_accessibility", "web_performance", "api_design", "security",
  "sql", "data_modeling", "python", "distributed_systems", "linux",
  "networking", "cloud", "ci_cd", "observability", "mobile_platforms",
  "api_integration", "testing", "deployment", "version_control",
  "programming_fundamentals",
];

function prettySkill(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function SkillAssessmentsPanel() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [skillKey, setSkillKey] = useState("problem_solving");
  const [rating, setRating] = useState(3);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [assessmentResponse, recommendationResponse] = await Promise.all([
        fetch("/api/skill-assessments", { cache: "no-store" }),
        fetch("/api/intelligence/recommendations", { cache: "no-store" }),
      ]);
      const assessmentData = await assessmentResponse.json();
      const recommendationData = await recommendationResponse.json();
      if (!assessmentResponse.ok) throw new Error(assessmentData.error ?? "Could not load skill assessments.");
      setAssessments(assessmentData.assessments ?? []);
      setRecommendations(recommendationResponse.ok ? recommendationData.recommendations ?? [] : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load skill assessments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) void loadData();
    else {
      setAssessments([]);
      setRecommendations([]);
    }
  }, [session?.user.id]);

  async function createAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/skill-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillKey, rating, evidenceNote: evidenceNote.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save assessment.");
      setEvidenceNote("");
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save assessment.");
    } finally {
      setSaving(false);
    }
  }

  async function updateRating(item: Assessment, nextRating: number) {
    setError("");
    try {
      const response = await fetch("/api/skill-assessments/" + item.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: nextRating }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update rating.");
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update rating.");
    }
  }

  async function deleteAssessment(item: Assessment) {
    if (!window.confirm("Delete this assessment record?")) return;
    setError("");
    try {
      const response = await fetch("/api/skill-assessments/" + item.id, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete assessment.");
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete assessment.");
    }
  }

  if (sessionPending) {
    return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-zinc-500">Checking your account…</div>;
  }

  if (!session) {
    return (
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white"><BrainCircuit className="h-4 w-4 text-violet-300" /> Skill assessments</div>
        <p className="mt-2 text-sm text-zinc-500">Sign in to record skill ratings, evidence and progress over time.</p>
        <a href="/sign-in" className="mt-4 inline-flex rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white">Sign in to continue</a>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Know your strengths</p>
          <h2 className="text-lg font-semibold text-white">Skill assessments</h2>
          <p className="mt-1 text-xs text-zinc-500">Self-ratings from 1 (building) to 5 (confident), supported by your own evidence.</p>
        </div>
        <button type="button" onClick={() => void loadData()} disabled={loading} aria-label="Refresh assessments" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></button>
      </div>

      <form onSubmit={createAssessment} className="mb-5 grid gap-3 sm:grid-cols-2">
        <select value={skillKey} onChange={(event) => setSkillKey(event.target.value)} className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200">
          {suggestedSkills.map((item) => <option key={item} value={item}>{prettySkill(item)}</option>)}
        </select>
        <select aria-label="Skill rating" value={rating} onChange={(event) => setRating(Number(event.target.value))} className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200">
          {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5 · {["Building", "Learning", "Developing", "Strong", "Confident"][value - 1]}</option>)}
        </select>
        <textarea value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} maxLength={2000} rows={2} placeholder="Evidence or notes (optional): what have you built, solved or practised?" className="resize-y rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400 sm:col-span-2" />
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50 sm:col-span-2"><Plus className="h-4 w-4" /> {saving ? "Saving…" : "Save assessment"}</button>
      </form>

      {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Assessment history</p>
          <div className="space-y-2">
            {assessments.map((item) => (
              <article key={item.id} className="rounded-xl border border-white/[0.07] bg-black/15 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><h3 className="text-xs font-semibold text-zinc-200">{prettySkill(item.skillKey)}</h3><p className="mt-1 text-[10px] text-zinc-600">{new Date(item.assessedAt).toLocaleString()}</p></div>
                  <div className="flex items-center gap-2">
                    <select aria-label={"Update rating for " + item.skillKey} value={item.rating} onChange={(event) => void updateRating(item, Number(event.target.value))} className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200">
                      {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}
                    </select>
                    <button type="button" onClick={() => void deleteAssessment(item)} aria-label={"Delete " + item.skillKey + " assessment"} className="rounded-lg border border-white/10 p-2 text-zinc-500 hover:border-red-400/30 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                {item.evidenceNote && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-400">{item.evidenceNote}</p>}
              </article>
            ))}
            {!loading && assessments.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-zinc-500">No assessments yet. Add one above to establish your baseline.</p>}
          </div>
        </div>

        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Suggested next steps</p>
          <div className="space-y-2">
            {recommendations.map((item) => (
              <article key={item.id} className="rounded-xl border border-violet-300/15 bg-violet-400/[0.04] p-3">
                <h3 className="text-xs font-semibold text-zinc-100">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{item.reason}</p>
                <a href={item.href} className="mt-3 inline-flex text-[11px] font-semibold text-violet-300 hover:text-violet-200">Open practice module ↗</a>
              </article>
            ))}
            {recommendations.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-zinc-500">Save an assessment to receive a rule-based practice suggestion.</p>}
          </div>
        </div>
      </div>
      <p className="mt-4 text-[10px] leading-4 text-zinc-600">Ratings are self-reported, not independently verified. Recommendations use transparent rules; they are not AI-generated evaluations.</p>
    </section>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Plus, RefreshCw, Target, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type Goal = {
  id: string;
  targetRole: string;
  targetCompany: string | null;
  targetDate: string | null;
  status: "active" | "paused" | "completed" | "archived";
  _count?: { practiceSessions: number; skillAssessments: number };
};

export function CareerGoalsPanel() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [targetDate, setTargetDate] = useState("");

  async function loadGoals() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/career-goals", { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 401) throw new Error("Sign in to create and view your saved career goals.");
        throw new Error("Could not load career goals.");
      }
      const data = await response.json();
      setGoals(data.goals ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load career goals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) void loadGoals();
    else setGoals([]);
  }, [session?.user.id]);

  async function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/career-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          targetCompany: targetCompany.trim() || null,
          targetDate: targetDate || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save career goal.");
      setGoals((current) => [data.goal, ...current]);
      setTargetRole("");
      setTargetCompany("");
      setTargetDate("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save career goal.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(goal: Goal, status: Goal["status"]) {
    setError("");
    try {
      const response = await fetch("/api/career-goals/" + goal.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not update goal.");
      setGoals((current) => current.map((item) => item.id === goal.id ? { ...item, ...data.goal } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update goal.");
    }
  }

  async function deleteGoal(goal: Goal) {
    if (!window.confirm("Delete this career goal? Linked practice sessions will be kept without the goal link.")) return;
    setError("");
    try {
      const response = await fetch("/api/career-goals/" + goal.id, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete goal.");
      setGoals((current) => current.filter((item) => item.id !== goal.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete goal.");
    }
  }

  if (sessionPending) {
    return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-zinc-500">Checking your account…</div>;
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white"><Target className="h-4 w-4 text-violet-300" /> Career goals</div>
        <p className="mt-2 text-sm text-zinc-500">Sign in to save a target role, company and preparation date. Your goals will stay linked to your account.</p>
        <a href="/sign-in" className="mt-4 inline-flex rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-400">Sign in to continue</a>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Personal direction</p>
          <h2 className="text-lg font-semibold text-white">Career goals</h2>
        </div>
        <button type="button" onClick={() => void loadGoals()} disabled={loading} aria-label="Refresh career goals" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></button>
      </div>

      <form onSubmit={createGoal} className="mb-5 grid gap-3 sm:grid-cols-2">
        <input required minLength={2} maxLength={120} value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Target role (e.g. Backend Engineer)" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400 sm:col-span-2" />
        <input maxLength={120} value={targetCompany} onChange={(event) => setTargetCompany(event.target.value)} placeholder="Target company (optional)" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400" />
        <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-400" />
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50 sm:col-span-2">
          <Plus className="h-4 w-4" /> {saving ? "Saving…" : "Add career goal"}
        </button>
      </form>

      {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}

      {loading && goals.length === 0 ? <p className="text-sm text-zinc-500">Loading saved goals…</p> : null}
      {!loading && goals.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-zinc-500">No goals yet. Add your first target above.</p> : null}

      <div className="space-y-3">
        {goals.map((goal) => (
          <article key={goal.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{goal.targetRole}</h3>
                <p className="mt-1 text-xs text-zinc-500">{goal.targetCompany || "No company selected"}</p>
                {goal.targetDate && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500"><CalendarDays className="h-3.5 w-3.5" /> Target: {new Date(goal.targetDate).toLocaleDateString()}</p>}
                <p className="mt-2 text-[11px] text-zinc-600">{goal._count?.practiceSessions ?? 0} practice sessions · {goal._count?.skillAssessments ?? 0} skill assessments</p>
              </div>
              <div className="flex items-center gap-2">
                <select aria-label={"Status for " + goal.targetRole} value={goal.status} onChange={(event) => void changeStatus(goal, event.target.value as Goal["status"])} className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300">
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
                <button type="button" onClick={() => void deleteGoal(goal)} aria-label={"Delete " + goal.targetRole} className="rounded-lg border border-white/10 p-2 text-zinc-500 hover:border-red-400/30 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

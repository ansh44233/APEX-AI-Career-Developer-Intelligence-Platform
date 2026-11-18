"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, ListTodo, RefreshCw, XCircle } from "lucide-react";

type Suggestion = { id: string; title: string; reason: string; href: string; basis: string; priority?: number };
type Roadmap = { goals: Array<{ goal: { id: string; targetRole: string; targetCompany: string | null }; tasks: Array<{ id: string; title: string; description: string; module: string; status: string }> }> };
type Goal = { id: string; targetRole: string; targetCompany: string | null };
type Job = { id: string; company: string; role: string };
type Tracked = {
  id: string; sourceKey: string; title: string; reason: string; href: string; basis: string;
  status: string; dueAt: string | null; completedAt: string | null;
  goal: { id: string; targetRole: string; targetCompany: string | null } | null;
  job: { id: string; company: string; role: string; status: string } | null;
  roadmapTask: { id: string; title: string; status: string; module: string } | null;
};

export function RecommendationTrackerPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [tracked, setTracked] = useState<Tracked[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const urls = [
        "/api/intelligence/recommendations",
        "/api/intelligence/roadmap",
        "/api/intelligence/recommendation-actions",
        "/api/career-goals",
        "/api/jobs",
      ];
      const responses = await Promise.all(urls.map(url => fetch(url, { cache: "no-store" })));
      const payloads = await Promise.all(responses.map(response => response.json()));
      const failed = responses.findIndex(response => !response.ok);
      if (failed >= 0) throw new Error(payloads[failed]?.error || "Could not load recommendation tracking.");
      const roadmap = payloads[1] as Roadmap;
      const roadmapSuggestions: Suggestion[] = roadmap.goals.flatMap(group => {
        const next = group.tasks.find(task => task.status !== "completed");
        return next ? [{
          id: "roadmap-" + next.id,
          title: next.title,
          reason: (group.goal.targetCompany ? group.goal.targetCompany + " · " : "") + group.goal.targetRole + ". " + next.description,
          href: next.module,
          basis: "roadmap",
          priority: 60,
        }] : [];
      }).slice(0, 3);
      setSuggestions([...(payloads[0].recommendations || []), ...roadmapSuggestions].slice(0, 8));
      setTracked(payloads[2].actions || []);
      setGoals(payloads[3].goals || []);
      setJobs(payloads[4].jobs || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Recommendation tracking is unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const trackedByKey = useMemo(() => new Map(tracked.map(item => [item.sourceKey, item])), [tracked]);

  const updateSuggestion = useCallback(async (item: Suggestion, action: "accepted" | "deferred" | "dismissed") => {
    setBusyKey(item.id);
    setError("");
    setNotice("");
    try {
      const isRoadmap = item.id.startsWith("roadmap-");
      const response = await fetch("/api/intelligence/recommendation-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceKey: item.id,
          title: item.title,
          reason: item.reason,
          href: item.href,
          basis: item.basis,
          action,
          ...(!isRoadmap && selectedGoalId ? { goalId: selectedGoalId } : {}),
          ...(selectedJobId ? { jobId: selectedJobId } : {}),
          ...(action === "deferred" ? { dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update this recommendation.");
      setNotice(action === "accepted" ? "Recommendation accepted and saved." : action === "deferred" ? "Recommendation deferred for two days." : "Recommendation dismissed.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this recommendation.");
    } finally {
      setBusyKey("");
    }
  }, [load, selectedGoalId, selectedJobId]);

  const completeAction = useCallback(async (item: Tracked) => {
    setBusyKey(item.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/intelligence/recommendation-actions/" + item.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not complete this action.");
      setNotice(item.roadmapTask ? "Completed and updated the linked preparation task." : "Marked complete and saved to your career history.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete this action.");
    } finally {
      setBusyKey("");
    }
  }, [load]);

  const activeTracked = tracked.filter(item => item.status !== "dismissed");
  const dismissed = tracked.filter(item => item.status === "dismissed");

  return <section className="rounded-3xl border border-violet-300/15 bg-[#111119] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-violet-300"><ListTodo className="h-4 w-4"/> PHASE 32 · RECOMMENDATION TRACKING</p><h2 className="mt-2 text-xl font-semibold text-white">Turn suggestions into progress</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">Accept, defer or dismiss a recommendation. Accepted actions stay in your account and can be linked to a career goal or saved job.</p></div>
      <button type="button" onClick={() => void load()} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"><RefreshCw className="h-3.5 w-3.5"/> Refresh</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200">{notice}</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-[11px] text-zinc-400">Link new actions to a career goal (optional)
        <select value={selectedGoalId} onChange={event => setSelectedGoalId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#171720] px-3 py-2 text-xs text-white"><option value="">No goal link</option>{goals.map(goal => <option key={goal.id} value={goal.id}>{goal.targetRole}{goal.targetCompany ? " · " + goal.targetCompany : ""}</option>)}</select>
      </label>
      <label className="text-[11px] text-zinc-400">Link new actions to a saved job (optional)
        <select value={selectedJobId} onChange={event => setSelectedJobId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#171720] px-3 py-2 text-xs text-white"><option value="">No job link</option>{jobs.map(job => <option key={job.id} value={job.id}>{job.company} · {job.role}</option>)}</select>
      </label>
    </div>

    <div className="mt-5 grid gap-3 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">New recommendations</h3>
        {loading ? <p className="text-xs text-zinc-500">Loading recommendations…</p> : suggestions.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-zinc-500">No new recommendations right now.</p> :
          <div className="space-y-2">{suggestions.map(item => {
            const saved = trackedByKey.get(item.id);
            const isBusy = busyKey === item.id;
            return <article key={item.id} className="rounded-2xl border border-white/[0.07] bg-black/20 p-3">
              <div className="flex items-start justify-between gap-2"><div><h4 className="text-xs font-medium text-zinc-200">{item.title}</h4><p className="mt-1 text-[10px] leading-5 text-zinc-500">{item.reason}</p></div><a href={item.href} aria-label={"Open " + item.title} className="text-violet-300"><ArrowUpRight className="h-4 w-4"/></a></div>
              {saved ? <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                <span className="rounded-md border border-white/10 px-2 py-1 text-zinc-300">{saved.status}</span>
                {saved.dueAt && <span className="text-zinc-500">Due {new Date(saved.dueAt).toLocaleDateString()}</span>}
                {saved.status === "accepted" || saved.status === "deferred" ? <button type="button" disabled={isBusy} onClick={() => void completeAction(saved)} className="rounded-lg border border-emerald-300/20 px-2.5 py-1.5 text-emerald-200 disabled:opacity-40">{isBusy ? "Saving…" : "Mark complete"}</button> : null}
                {saved.status === "dismissed" && <button type="button" disabled={isBusy} onClick={() => void updateSuggestion(item, "accepted")} className="rounded-lg border border-violet-300/20 px-2.5 py-1.5 text-violet-200 disabled:opacity-40">Accept again</button>}
              </div> : <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={isBusy} onClick={() => void updateSuggestion(item, "accepted")} className="rounded-lg bg-violet-500 px-3 py-1.5 text-[10px] font-semibold text-white disabled:opacity-40">{isBusy ? "Saving…" : "Accept"}</button>
                <button type="button" disabled={isBusy} onClick={() => void updateSuggestion(item, "deferred")} className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] text-zinc-300 disabled:opacity-40"><Clock3 className="mr-1 inline h-3 w-3"/> Defer 2 days</button>
                <button type="button" disabled={isBusy} onClick={() => void updateSuggestion(item, "dismissed")} className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] text-zinc-500 disabled:opacity-40"><XCircle className="mr-1 inline h-3 w-3"/> Dismiss</button>
              </div>}
            </article>;
          })}</div>}
      </div>
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">Your tracked actions</h3>
        {activeTracked.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-zinc-500">Accepted and deferred actions will appear here.</p> :
          <div className="space-y-2">{activeTracked.map(item => <article key={item.id} className="rounded-2xl border border-white/[0.07] bg-black/20 p-3">
            <div className="flex items-start justify-between gap-2"><div><h4 className="text-xs font-medium text-zinc-200">{item.title}</h4><p className="mt-1 text-[10px] text-zinc-500">{item.goal ? item.goal.targetRole + (item.goal.targetCompany ? " · " + item.goal.targetCompany : "") : item.job ? item.job.company + " · " + item.job.role : "General career action"}</p></div><span className="rounded-md border border-white/10 px-2 py-1 text-[9px] text-zinc-400">{item.status}</span></div>
            {item.dueAt && <p className="mt-2 text-[10px] text-zinc-500">Deferred until {new Date(item.dueAt).toLocaleString()}</p>}
            {item.roadmapTask && <p className="mt-2 text-[10px] text-violet-200/80">Linked preparation task: {item.roadmapTask.title}</p>}
            {item.status === "accepted" || item.status === "deferred" ? <button type="button" disabled={busyKey === item.id} onClick={() => void completeAction(item)} className="mt-2 rounded-lg border border-emerald-300/20 px-3 py-1.5 text-[10px] text-emerald-200 disabled:opacity-40">{busyKey === item.id ? "Saving…" : "Mark complete"}</button> : <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald-200"><CheckCircle2 className="h-3 w-3"/> Completed {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : ""}</p>}
          </article>)}</div>}
        {dismissed.length > 0 && <p className="mt-3 text-[10px] text-zinc-600">{dismissed.length} dismissed recommendation{dismissed.length === 1 ? "" : "s"} retained in your history.</p>}
      </div>
    </div>
    <p className="mt-4 text-[10px] leading-5 text-zinc-600">Completion is user-reported. When an action came from a preparation roadmap task, marking it complete also updates that exact task. Other actions are linked to the selected goal/job when provided; no recruiter contact, application-stage changes or external scheduling occurs.</p>
  </section>;
}

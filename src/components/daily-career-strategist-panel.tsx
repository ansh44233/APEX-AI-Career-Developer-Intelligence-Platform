"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarClock, CheckCircle2, Clock3, RefreshCw, Sparkles } from "lucide-react";

type PlanItem = {
  id: string; title: string; reason: string; href: string; basis: string;
  goalId?: string; jobId?: string; dueAt: string | null; priority: number;
  urgency: "urgent" | "soon" | "flexible"; estimatedMinutes: number;
  sourceType: string; sourceLabel: string;
  executionState?: "new" | "accepted" | "stalled" | "deferred_due";
  evidence?: { title: string; url: string; excerpt: string } | null;
};
type Payload = {
  generatedAt: string; horizonDays: number; items: PlanItem[];
  summary: { activeGoals: number; upcomingEvents: number; linkedApplications: number; incompleteRoadmapTasks: number };
  weeklyReview: { since: string; practiceSessions: number; completedTimelineEvents: number; completedRoadmapTasks: number; completedJobPreparationTasks: number; completedRecommendations: number };
  weeklyPlan: Array<{ id: string; title: string; reason: string; href: string; basis: string; goalId?: string; jobId?: string; estimatedMinutes: number; urgency: string; executionState: string }>;
  executionFeedback: { recommendationActionsLast30Days: Record<string, number>; linkedApplicationStages: Record<string, number>; methodology: string };
  methodology: string; limits: string;
};
type SavedAction = { sourceKey: string; status: string };

function actionKey(id: string) {
  return "skill-daily-" + id.replace(/[^a-z0-9_-]/gi, "_");
}

export function DailyCareerStrategistPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [saved, setSaved] = useState<SavedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [busyWeekly, setBusyWeekly] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [planResponse, actionsResponse] = await Promise.all([
        fetch("/api/intelligence/daily-plan", { cache: "no-store" }),
        fetch("/api/intelligence/recommendation-actions", { cache: "no-store" }),
      ]);
      const [plan, actions] = await Promise.all([planResponse.json(), actionsResponse.json()]);
      if (!planResponse.ok) throw new Error(plan.error || "Could not build today's plan.");
      if (!actionsResponse.ok) throw new Error(actions.error || "Could not load saved action status.");
      setData(plan);
      setSaved((actions.actions || []).map((item: SavedAction) => ({ sourceKey: item.sourceKey, status: item.status })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Daily career plan is unavailable.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const savedByKey = useMemo(() => new Map(saved.map(item => [item.sourceKey, item.status] as const)), [saved]);

  const saveAction = useCallback(async (item: PlanItem) => {
    setBusy(item.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/intelligence/recommendation-actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceKey: actionKey(item.id), title: item.title, reason: item.reason,
          href: item.href, basis: "daily_plan", action: "accepted",
          ...(item.goalId ? { goalId: item.goalId } : {}),
          ...(item.jobId ? { jobId: item.jobId } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this action.");
      setNotice("Added to your Career Action Tracker. Nothing else was changed.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this action.");
    } finally { setBusy(""); }
  }, [load]);

  const approveWeeklyPlan = useCallback(async () => {
    if (!data?.weeklyPlan.length) return;
    setBusyWeekly(true); setError(""); setNotice("");
    let savedCount = 0;
    try {
      for (const item of data.weeklyPlan) {
        const response = await fetch("/api/intelligence/recommendation-actions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceKey: actionKey(item.id), title: item.title, reason: item.reason,
            href: item.href, basis: "daily_plan", action: "accepted",
            ...(item.goalId ? { goalId: item.goalId } : {}),
            ...(item.jobId ? { jobId: item.jobId } : {}),
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not approve the complete weekly plan.");
        savedCount += 1;
      }
      setNotice(savedCount + " weekly plan actions approved and added to your Career Action Tracker.");
      await load();
    } catch (cause) {
      setError((cause instanceof Error ? cause.message : "Weekly plan approval was interrupted.") + " " + savedCount + " action(s) were saved before the interruption.");
      await load();
    } finally { setBusyWeekly(false); }
  }, [data, load]);

  const visible = (data?.items ?? []).filter(item => !skipped.includes(item.id));
  const totalMinutes = visible.reduce((sum, item) => sum + item.estimatedMinutes, 0);

  return <section className="rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.06] via-[#111119] to-[#111119] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-cyan-200"><Sparkles className="h-4 w-4"/> PHASE 42 · ADAPTIVE EXECUTION ENGINE</p><h2 className="mt-2 text-xl font-semibold text-white">Your daily career plan</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">A plan that adapts to saved deadlines, approved evidence, preparation progress and your previous accept, defer and completion decisions.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300 disabled:opacity-50"><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}/> Refresh plan</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-200">{notice}</p>}
    {loading && !data && <p className="mt-4 text-xs text-zinc-500">Building a plan from your saved career records…</p>}
    {data && <>
      <div className="mt-3"><a href="/features/agent-workbench?skill=career-copilot&prompt=Review%20my%20current%20APEX%20daily%20career%20plan.%20Explain%20the%20top%20priorities%2C%20the%20saved%20records%20behind%20them%2C%20and%20help%20me%20choose%20one%20manageable%20next%20step." className="inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[0.06] px-3 py-2 text-[10px] font-semibold text-violet-100 hover:bg-violet-300/10">Discuss this plan with Career Copilot <ArrowUpRight className="h-3.5 w-3.5"/></a><p className="mt-1 text-[9px] text-zinc-600">Career data sharing remains off until you explicitly enable it in the Copilot message.</p></div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-[9px] uppercase tracking-wider text-zinc-500">Active goals</p><p className="mt-1 text-lg font-semibold text-white">{data.summary.activeGoals}</p></div>
        <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-[9px] uppercase tracking-wider text-zinc-500">Upcoming actions</p><p className="mt-1 text-lg font-semibold text-white">{data.summary.upcomingEvents}</p></div>
        <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-[9px] uppercase tracking-wider text-zinc-500">Linked applications</p><p className="mt-1 text-lg font-semibold text-white">{data.summary.linkedApplications}</p></div>
        <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-[9px] uppercase tracking-wider text-zinc-500">Suggested effort</p><p className="mt-1 text-lg font-semibold text-white">{totalMinutes} min</p></div>
      </div>
      <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200">Your last 7 days</p><span className="text-[9px] text-zinc-600">Saved activity · since {new Date(data.weeklyReview.since).toLocaleDateString()}</span></div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div><p className="text-lg font-semibold text-white">{data.weeklyReview.practiceSessions}</p><p className="text-[9px] text-zinc-500">Practice sessions</p></div>
          <div><p className="text-lg font-semibold text-white">{data.weeklyReview.completedTimelineEvents}</p><p className="text-[9px] text-zinc-500">Follow-ups done</p></div>
          <div><p className="text-lg font-semibold text-white">{data.weeklyReview.completedRoadmapTasks}</p><p className="text-[9px] text-zinc-500">Roadmap tasks done</p></div>
          <div><p className="text-lg font-semibold text-white">{data.weeklyReview.completedJobPreparationTasks}</p><p className="text-[9px] text-zinc-500">Job prep tasks done</p></div>
          <div><p className="text-lg font-semibold text-white">{data.weeklyReview.completedRecommendations}</p><p className="text-[9px] text-zinc-500">Actions completed</p></div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-violet-300/15 bg-violet-300/[0.035] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200">Adaptive weekly execution plan</p><p className="mt-1 text-[9px] text-zinc-500">A suggested focus list based on your previous decisions. Nothing is saved until you approve it.</p></div><button type="button" onClick={() => void approveWeeklyPlan()} disabled={busyWeekly || data.weeklyPlan.length === 0} className="rounded-lg bg-violet-300 px-3 py-2 text-[10px] font-semibold text-[#100b19] disabled:opacity-50">{busyWeekly ? "Approving..." : "Approve weekly plan"}</button></div>
        {data.weeklyPlan.length === 0 ? <p className="mt-3 text-[10px] text-zinc-500">No open suggestions for this week.</p> : <div className="mt-3 space-y-2">{data.weeklyPlan.map((item, index) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-black/20 p-2"><div className="flex min-w-0 gap-2"><span className="text-[10px] text-violet-200">{index + 1}.</span><div className="min-w-0"><p className="text-[10px] font-medium text-zinc-200">{item.title}</p><p className="mt-1 text-[9px] text-zinc-500">{item.executionState} · {item.estimatedMinutes} min</p></div></div><a href={item.href} className="shrink-0 text-violet-200"><ArrowUpRight className="h-3.5 w-3.5"/></a></div>)}</div>}
      </div>
      <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Execution feedback · last 30 days</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{(["accepted", "deferred", "dismissed", "completed"] as const).map(status => <div key={status}><p className="text-lg font-semibold text-white">{data.executionFeedback.recommendationActionsLast30Days[status] ?? 0}</p><p className="text-[9px] capitalize text-zinc-500">{status}</p></div>)}</div>
        <p className="mt-2 text-[9px] leading-4 text-zinc-600">{data.executionFeedback.methodology}</p>
        <p className="mt-2 text-[9px] leading-4 text-zinc-500">Linked application stages: {Object.entries(data.executionFeedback.linkedApplicationStages).filter(([, count]) => count > 0).map(([status, count]) => status + " " + count).join(" · ") || "No linked applications recorded"}.</p>
      </div>
      {visible.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-center"><CheckCircle2 className="mx-auto h-5 w-5 text-emerald-300"/><p className="mt-2 text-sm text-zinc-300">{data.items.length ? "You've hidden the current suggestions." : "No urgent or incomplete actions found."}</p><p className="mt-1 text-[10px] text-zinc-600">Refresh after updating your goals, applications or roadmap.</p>{skipped.length > 0 && <button type="button" onClick={() => setSkipped([])} className="mt-3 text-[10px] text-cyan-200">Show hidden suggestions</button>}</div> : <div className="mt-4 space-y-3">{visible.map((item, index) => {
        const key = actionKey(item.id); const status = savedByKey.get(key);
        return <article key={item.id} className="rounded-xl border border-white/[0.08] bg-black/20 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/10 text-[10px] font-semibold text-cyan-200">{index + 1}</span><span className={"rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-wider " + (item.urgency === "urgent" ? "bg-rose-400/10 text-rose-200" : item.urgency === "soon" ? "bg-amber-300/10 text-amber-200" : "bg-white/[0.06] text-zinc-400")}>{item.executionState === "stalled" ? "stalled" : item.executionState === "deferred_due" ? "deferred · due" : item.urgency}</span></div><span className="flex items-center gap-1 text-[9px] text-zinc-500"><Clock3 className="h-3 w-3"/>{item.estimatedMinutes} min suggested</span></div>
          <h3 className="mt-2 text-sm font-semibold text-white">{item.title}</h3><p className="mt-1 text-[10px] leading-5 text-zinc-400">{item.reason}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-zinc-600"><span>{item.sourceLabel}</span>{item.dueAt && <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3"/>{new Date(item.dueAt).toLocaleString()}</span>}</div>
          {item.evidence && <div className="mt-3 rounded-lg border border-emerald-300/10 bg-emerald-300/[0.035] p-2"><p className="text-[9px] font-semibold text-emerald-200">Approved source · {item.evidence.title}</p><p className="mt-1 text-[10px] leading-5 text-zinc-400">{item.evidence.excerpt}</p><a href={item.evidence.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[9px] text-emerald-200">Open source <ArrowUpRight className="h-3 w-3"/></a></div>}
          <div className="mt-3 flex flex-wrap items-center gap-2"><a href={item.href} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-200 hover:bg-white/5">Open in APEX <ArrowUpRight className="h-3 w-3"/></a>{status && status !== "dismissed" ? <span className="inline-flex items-center gap-1 text-[10px] text-emerald-200"><CheckCircle2 className="h-3.5 w-3.5"/> Saved · {status}</span> : <button type="button" onClick={() => void saveAction(item)} disabled={busy === item.id} className="rounded-lg bg-cyan-300 px-3 py-2 text-[10px] font-semibold text-[#071016] disabled:opacity-50">{busy === item.id ? "Saving…" : "Add to action tracker"}</button>}<button type="button" onClick={() => setSkipped(current => [...current, item.id])} className="px-2 py-2 text-[10px] text-zinc-600 hover:text-zinc-300">Hide today</button></div>
        </article>;
      })}</div>}
      <p className="mt-4 text-[9px] leading-5 text-zinc-600">{data.methodology} {data.limits} Estimates are optional suggestions, not commitments or scheduled reminders.</p>
    </>}
  </section>;
}

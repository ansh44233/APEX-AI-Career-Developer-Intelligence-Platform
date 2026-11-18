"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, BellRing, CalendarClock, CheckCircle2, Clock3, Plus, RefreshCw, Trash2 } from "lucide-react";

type Job = { id: string; company: string; role: string; status: string };
type EventType = "deadline" | "follow_up" | "interview" | "assessment" | "other";
type TimelineEvent = {
  id: string; jobId: string; eventType: EventType; title: string; details: string | null;
  scheduledAt: string; status: "pending" | "completed" | "cancelled";
  completedAt: string | null; job: { company: string; role: string; status: string };
};
const eventTypes: { value: EventType; label: string }[] = [
  { value: "deadline", label: "Application deadline" },
  { value: "follow_up", label: "Follow-up" },
  { value: "interview", label: "Interview" },
  { value: "assessment", label: "Assessment" },
  { value: "other", label: "Other" },
];
const typeLabel: Record<EventType, string> = { deadline: "Deadline", follow_up: "Follow-up", interview: "Interview", assessment: "Assessment", other: "Other" };
function localDateTime(daysAhead = 1) {
  const date = new Date(Date.now() + daysAhead * 86_400_000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
}
function dateLabel(value: string) {
  return new Date(value).toLocaleString([], { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ApplicationFollowUpsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [jobId, setJobId] = useState("");
  const [eventType, setEventType] = useState<EventType>("follow_up");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [scheduledAt, setScheduledAt] = useState(localDateTime());
  const [filter, setFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [jobResponse, eventResponse] = await Promise.all([
        fetch("/api/jobs", { cache: "no-store" }),
        fetch("/api/job-events", { cache: "no-store" }),
      ]);
      if (jobResponse.status === 401 || eventResponse.status === 401) throw new Error("Sign in to manage application follow-ups.");
      const [jobData, eventData] = await Promise.all([jobResponse.json(), eventResponse.json()]);
      if (!jobResponse.ok) throw new Error(jobData.error || "Could not load jobs.");
      if (!eventResponse.ok) throw new Error(eventData.error || "Could not load timeline events.");
      setJobs(jobData.jobs || []); setEvents(eventData.events || []);
      setJobId(current => current || jobData.jobs?.[0]?.id || "");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load application timeline."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const now = Date.now();
  const pending = events.filter(event => event.status === "pending");
  const overdueCount = pending.filter(event => new Date(event.scheduledAt).getTime() < now).length;
  const upcomingCount = pending.filter(event => new Date(event.scheduledAt).getTime() >= now).length;
  const visible = useMemo(() => events.filter(event => {
    if (filter === "upcoming") return event.status === "pending" && new Date(event.scheduledAt).getTime() >= Date.now();
    if (filter === "overdue") return event.status === "pending" && new Date(event.scheduledAt).getTime() < Date.now();
    if (filter === "completed") return event.status === "completed";
    return true;
  }), [events, filter]);

  async function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/job-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId, eventType, title, details: details || null, scheduledAt: new Date(scheduledAt).toISOString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save reminder.");
      setTitle(""); setDetails(""); setNotice("Timeline event saved."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save reminder."); }
    finally { setSaving(false); }
  }
  async function setStatus(event: TimelineEvent, status: TimelineEvent["status"]) {
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/job-events/" + event.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update event.");
      await load(); setNotice(status === "completed" ? "Marked as completed." : "Event updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update event."); }
  }
  async function removeEvent(event: TimelineEvent) {
    if (!window.confirm("Delete this timeline event?")) return;
    try {
      const response = await fetch("/api/job-events/" + event.id, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete event.");
      setEvents(current => current.filter(item => item.id !== event.id));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not delete event."); }
  }

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/features/job-intelligence" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Job Intelligence</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard</a>
    </header>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><BellRing className="h-4 w-4"/> APEX INTELLIGENCE / CAREER PIPELINE</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Never lose track<br/><span className="text-violet-300">of the next step.</span></h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Keep application deadlines, recruiter follow-ups, interviews and assessments in one timeline, linked to the job you saved.</p>
      </div>

      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#111119] p-4"><p className="text-2xl font-semibold">{pending.length}</p><p className="text-xs text-zinc-500">Open actions</p></div>
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4"><p className="text-2xl font-semibold text-amber-200">{overdueCount}</p><p className="text-xs text-zinc-500">Past due · needs review</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#111119] p-4"><p className="text-2xl font-semibold">{upcomingCount}</p><p className="text-xs text-zinc-500">Upcoming actions</p></div>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)]">
        <form onSubmit={addEvent} className="h-fit rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><Plus className="h-5 w-5"/></div><div><h2 className="font-semibold">Add a timeline event</h2><p className="text-xs text-zinc-500">Create a date to keep on your radar</p></div></div>
          <label className="block text-xs text-zinc-400">Linked job<select required value={jobId} onChange={e=>setJobId(e.target.value)} disabled={!jobs.length} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#171720] px-3 py-2.5 text-sm text-white"><option value="">Choose a saved job</option>{jobs.map(job=><option key={job.id} value={job.id}>{job.company} · {job.role}</option>)}</select></label>
          <label className="mt-3 block text-xs text-zinc-400">Event type<select value={eventType} onChange={e=>setEventType(e.target.value as EventType)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#171720] px-3 py-2.5 text-sm text-white">{eventTypes.map(type=><option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
          <label className="mt-3 block text-xs text-zinc-400">Title<input required minLength={2} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Email recruiter for an update" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"/></label>
          <label className="mt-3 block text-xs text-zinc-400">Date and time<input required type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"/></label>
          <label className="mt-3 block text-xs text-zinc-400">Notes <span className="text-zinc-600">· optional</span><textarea maxLength={1000} rows={3} value={details} onChange={e=>setDetails(e.target.value)} placeholder="Contact name, preparation notes or context…" className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"/></label>
          <button disabled={saving || !jobs.length} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50">{saving ? "Saving…" : "Save timeline event"} <CalendarClock className="h-4 w-4"/></button>
          {!jobs.length && <p className="mt-3 text-xs text-amber-200/80">Save a job in Job Intelligence before adding its follow-up events.</p>}
          <p className="mt-3 text-[11px] leading-5 text-zinc-600">Events are private and linked to a saved job. APEX tracks dates in the app; it does not send email, push or calendar notifications.</p>
        </form>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold">Application timeline</h2><p className="text-xs text-zinc-500">Your next actions, interviews and deadlines</p></div>
            <button onClick={()=>void load()} className="flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"><RefreshCw className="h-3.5 w-3.5"/> Refresh</button>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">{[["upcoming","Upcoming"],["overdue","Past due"],["completed","Completed"],["all","All events"]].map(([value,label])=><button key={value} onClick={()=>setFilter(value)} className={`rounded-lg border px-3 py-2 text-xs ${filter===value?"border-violet-400/40 bg-violet-400/10 text-violet-200":"border-white/10 text-zinc-400 hover:bg-white/5"}`}>{label}</button>)}</div>
          {loading ? <div className="rounded-2xl border border-white/10 bg-[#111119] p-8 text-center text-sm text-zinc-500">Loading timeline…</div> : visible.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#111119]/60 p-8 text-center"><CalendarClock className="mx-auto h-8 w-8 text-zinc-600"/><p className="mt-3 text-sm font-medium text-zinc-300">Nothing in this view yet.</p><p className="mt-1 text-xs text-zinc-500">Add a deadline, follow-up or interview to make your next step visible.</p></div> :
            <div className="space-y-3">{visible.map(event=>{
              const overdue = event.status === "pending" && new Date(event.scheduledAt).getTime() < Date.now();
              return <article key={event.id} className="rounded-2xl border border-white/10 bg-[#111119] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md border border-violet-300/20 bg-violet-300/10 px-2 py-1 text-[10px] font-semibold text-violet-200">{typeLabel[event.eventType]}</span>{overdue&&<span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[10px] text-amber-200">Past due</span>}{event.status!=="pending"&&<span className="text-[10px] text-zinc-500">{event.status}</span>}</div>
                    <h3 className="mt-2 font-semibold text-white">{event.title}</h3><p className="mt-1 text-xs text-zinc-400">{event.job.company} · {event.job.role}</p><p className={`mt-2 flex items-center gap-2 text-xs ${overdue?"text-amber-200":"text-zinc-500"}`}><Clock3 className="h-3.5 w-3.5"/>{dateLabel(event.scheduledAt)}</p>{event.details&&<p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-zinc-500">{event.details}</p>}
                  </div>
                  <div className="flex items-center gap-2">{event.status==="pending"&&<button onClick={()=>void setStatus(event,"completed")} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/20 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300/10"><CheckCircle2 className="h-3.5 w-3.5"/> Complete</button>}<button aria-label="Delete event" onClick={()=>void removeEvent(event)} className="rounded-lg border border-white/10 p-2 text-zinc-500 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5"/></button></div>
                </div>
              </article>;
            })}</div>}
        </section>
      </div>
    </section>
  </main>;
}

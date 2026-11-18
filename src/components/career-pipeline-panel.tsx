"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, CheckCircle2, Clock3, RefreshCw, Target } from "lucide-react";

type EventItem = { id: string; jobId: string; eventType: string; title: string; scheduledAt: string; job: { company: string; role: string; status: string } };
type Application = { id: string; company: string; role: string; status: string; updatedAt: string; preparation: { total: number; completed: number } };
type Pipeline = {
  applications: { total: number; active: number; byStatus: Record<string, number> };
  timeline: { total: number; pending: number; completed: number; byType: Record<string, number>; upcomingCount: number; overdueCount: number };
  preparation: { totalTasks: number; completedTasks: number; inProgressTasks: number; todoTasks: number; completionPercent: number | null };
  recentApplications: Application[]; upcomingEvents: EventItem[]; overdueEvents: EventItem[];
  methodology: { applications: string; preparation: string; timeline: string; limitations: string };
};
const stages = [{key:"saved",label:"Saved"},{key:"applied",label:"Applied"},{key:"interview",label:"Interview"},{key:"offer",label:"Offer"},{key:"rejected",label:"Not selected"},{key:"withdrawn",label:"Withdrawn"}];
const labels: Record<string,string> = { deadline:"Deadline", follow_up:"Follow-up", interview:"Interview", assessment:"Assessment", other:"Other" };
function formatDate(value:string) { return new Date(value).toLocaleString([], {weekday:"short", day:"numeric", month:"short", hour:"numeric", minute:"2-digit"}); }

export function CareerPipelinePanel() {
  const [data,setData] = useState<Pipeline|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [method,setMethod] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/career-pipeline",{cache:"no-store"});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load career pipeline.");
      setData(result);
    } catch(e) { setError(e instanceof Error ? e.message : "Could not load career pipeline."); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{void load();},[load]);

  if (loading) return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 text-sm text-zinc-500">Loading career pipeline intelligence…</section>;
  if (error) return <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6"><p className="text-sm text-rose-200">{error}</p><button onClick={()=>void load()} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300">Retry</button></section>;
  if (!data) return null;

  return <section className="rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.07] via-[#111119] to-[#111119] p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Phase 26 · Career intelligence</p><h2 className="mt-1 text-xl font-semibold text-white">Career pipeline overview</h2><p className="mt-1 text-xs text-zinc-500">Applications, preparation and next actions—connected.</p></div>
      <div className="flex gap-2"><button onClick={()=>setMethod(value=>!value)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-white">How it works</button><button onClick={()=>void load()} aria-label="Refresh career pipeline" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white"><RefreshCw className="h-4 w-4"/></button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={BriefcaseBusiness} label="Tracked applications" value={data.applications.total} note={data.applications.active+" active · "+(data.applications.byStatus.offer||0)+" offers"}/>
      <Metric icon={CalendarClock} label="Upcoming actions" value={data.timeline.upcomingCount} note={data.timeline.pending+" pending timeline events"}/>
      <Metric icon={Clock3} label="Past due" value={data.timeline.overdueCount} note="Pending events whose date has passed"/>
      <Metric icon={Target} label="Preparation tasks" value={data.preparation.totalTasks ? data.preparation.completedTasks+"/"+data.preparation.totalTasks : "—"} note={data.preparation.completionPercent===null?"No job preparation tasks yet":data.preparation.completionPercent+"% marked complete"}/>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
        <h3 className="mb-4 text-sm font-semibold text-zinc-200">Application stages</h3>
        <div className="space-y-3">{stages.map(stage=>{
          const count=data.applications.byStatus[stage.key]||0;
          const width=data.applications.total ? count/data.applications.total*100 : 0;
          return <div key={stage.key}><div className="mb-1.5 flex justify-between text-xs"><span className="text-zinc-400">{stage.label}</span><span className="tabular-nums text-zinc-300">{count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-violet-400" style={{width:width+"%"}}/></div></div>;
        })}</div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-zinc-500"><span>{data.timeline.completed} timeline events completed</span><span>{data.timeline.byType.interview||0} interview events</span><span>{data.timeline.byType.follow_up||0} follow-ups</span></div>
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-zinc-200">Next actions</h3><a href="/features/application-follow-ups" className="text-[11px] text-violet-300 hover:text-violet-200">Open timeline <ArrowUpRight className="ml-1 inline h-3 w-3"/></a></div>
        {data.overdueEvents.length===0&&data.upcomingEvents.length===0?<p className="py-5 text-xs text-zinc-500">No pending dates recorded. Add an interview, deadline or follow-up to your timeline.</p>:<div className="space-y-3">
          {data.overdueEvents.slice(0,3).map(event=><EventRow key={event.id} event={event} overdue/>)}
          {data.upcomingEvents.slice(0,5).map(event=><EventRow key={event.id} event={event}/>)}
        </div>}
      </div>
    </div>
    <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-zinc-200">Recently updated applications</h3><a href="/features/job-intelligence" className="text-[11px] text-violet-300 hover:text-violet-200">Manage jobs <ArrowUpRight className="ml-1 inline h-3 w-3"/></a></div>
      {data.recentApplications.length===0?<p className="py-4 text-xs text-zinc-500">Your saved job applications will appear here.</p>:<div className="grid gap-2 sm:grid-cols-2">{data.recentApplications.map(job=><div key={job.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-semibold text-zinc-200">{job.company}</p><p className="mt-1 truncate text-[11px] text-zinc-500">{job.role}</p></div><span className="rounded-md border border-white/10 px-2 py-1 text-[9px] text-zinc-400">{job.status}</span></div><div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500"><span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> {job.preparation.completed}/{job.preparation.total} prep tasks</span><a href={"/features/job-preparation?jobId="+job.id} className="text-violet-300">Prepare ↗</a></div></div>)}</div>}
    </div>
    {method&&<div className="mt-4 rounded-xl border border-violet-300/15 bg-violet-300/[0.04] p-4 text-[11px] leading-5 text-zinc-400"><p>{data.methodology.applications}</p><p className="mt-2">{data.methodology.preparation}</p><p className="mt-2">{data.methodology.timeline}</p><p className="mt-2 text-zinc-500">{data.methodology.limitations}</p></div>}
    <div className="mt-4 flex flex-wrap gap-3"><a href="/features/job-intelligence" className="rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-400">Manage applications</a><a href="/features/application-follow-ups" className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-zinc-300 hover:bg-white/5">Manage follow-ups</a></div>
  </section>;
}

function Metric({icon:Icon,label,value,note}:{icon:typeof BriefcaseBusiness;label:string;value:number|string;note:string}) {
  return <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"><div className="flex items-center justify-between"><p className="text-[11px] text-zinc-500">{label}</p><Icon className="h-4 w-4 text-violet-300"/></div><p className="mt-3 text-2xl font-semibold tabular-nums text-white">{value}</p><p className="mt-1 text-[10px] text-zinc-600">{note}</p></div>;
}
function EventRow({event,overdue=false}:{event:EventItem;overdue?:boolean}) {
  return <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-medium text-zinc-300">{event.title}</p><p className="mt-1 truncate text-[10px] text-zinc-600">{event.job.company} · {event.job.role} · {labels[event.eventType]||"Event"}</p></div><span className={`shrink-0 text-right text-[10px] ${overdue?"text-amber-200":"text-zinc-500"}`}>{formatDate(event.scheduledAt)}{overdue?" · overdue":""}</span></div>;
}

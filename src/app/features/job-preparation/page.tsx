"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, ExternalLink, FileText, Loader2, RefreshCw, ShieldCheck, Target } from "lucide-react";
import { detectJobSkills, jobSkillCatalog } from "@/lib/job-skill-catalog";

type Job = { id: string; company: string; role: string; location: string | null; sourceUrl: string | null; jobDescription: string; status: string };
type Task = { id: string; skillKey: string; title: string; description: string; module: string; status: "todo" | "in_progress" | "completed" };
type Plan = { job: { id: string; company: string; role: string; sourceUrl: string | null; goalId: string | null }; tasks: Task[]; methodology: string };

export default function JobPreparationPage() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("jobId") || "";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedId, setSelectedId] = useState(requestedId);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 401) throw new Error("Sign in to use job-specific preparation.");
      if (!response.ok) throw new Error(data.error || "Could not load saved jobs.");
      const nextJobs: Job[] = data.jobs || [];
      setJobs(nextJobs);
      const nextId = (requestedId && nextJobs.some(job => job.id === requestedId) ? requestedId : selectedId && nextJobs.some(job => job.id === selectedId) ? selectedId : nextJobs[0]?.id) || "";
      setSelectedId(nextId);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load saved jobs."); }
    finally { setLoading(false); }
  }, [requestedId, selectedId]);

  const loadPlan = useCallback(async (jobId: string) => {
    if (!jobId) { setPlan(null); return; }
    setError("");
    try {
      const response = await fetch("/api/jobs/" + jobId + "/preparation", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not build the preparation plan.");
      setPlan(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load preparation plan."); setPlan(null); }
  }, []);

  useEffect(() => { void loadJobs(); }, [loadJobs]);
  useEffect(() => { if (!loading && selectedId) void loadPlan(selectedId); }, [loading, selectedId, loadPlan]);

  const selectedJob = jobs.find(job => job.id === selectedId) || null;
  const requirements = useMemo(() => selectedJob ? detectJobSkills(selectedJob.jobDescription) : [], [selectedJob]);
  const resumeSkills = useMemo(() => detectJobSkills(resume), [resume]);
  const resumeKeys = new Set(resumeSkills.map(skill => skill.key));
  const matched = requirements.filter(skill => resumeKeys.has(skill.key));
  const possibleGaps = requirements.filter(skill => !resumeKeys.has(skill.key));
  const progress = plan?.tasks.length ? Math.round(plan.tasks.filter(task => task.status === "completed").length / plan.tasks.length * 100) : 0;

  async function updateTask(task: Task, status: Task["status"]) {
    if (!selectedId) return;
    setSavingId(task.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/jobs/" + selectedId + "/preparation", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update checklist.");
      setPlan(current => current ? { ...current, tasks: current.tasks.map(item => item.id === task.id ? { ...item, status } : item) } : current);
      setNotice("Preparation checklist updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update checklist."); }
    finally { setSavingId(""); }
  }

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/features/job-intelligence" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Job Intelligence</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard</a>
    </header>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><Target className="h-4 w-4"/> PHASE 24 / PREPARATION INTELLIGENCE</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">From job requirements<br/><span className="text-violet-300">to your next practice step.</span></h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">Compare a saved job with your resume locally, then work through a persistent preparation checklist. Your resume text stays in this browser page and is never sent to the server.</p>

      {error && <p role="alert" className="mt-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}

      <div className="mt-8 rounded-2xl border border-white/10 bg-[#111119] p-5">
        <label className="text-xs font-semibold text-zinc-400">SELECT A SAVED JOB</label>
        {loading ? <p className="mt-3 text-sm text-zinc-500">Loading saved jobs…</p> : jobs.length ? <select value={selectedId} onChange={event=>{setSelectedId(event.target.value);setPlan(null);}} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] px-3 py-3 text-sm text-white sm:max-w-xl">{jobs.map(job=><option key={job.id} value={job.id}>{job.company} · {job.role}{job.location ? " · "+job.location : ""}</option>)}</select> : <div className="mt-3 text-sm text-zinc-400">No saved jobs yet. <a href="/features/job-intelligence" className="text-violet-300 underline">Add a job listing first.</a></div>}
        {selectedJob?.sourceUrl && <a href={selectedJob.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 block text-xs text-violet-300 hover:text-violet-200">Open original job listing <ExternalLink className="ml-1 inline h-3 w-3"/></a>}
      </div>

      {selectedJob && <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-violet-300"/><h2 className="font-semibold">Resume comparison</h2></div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">Paste your resume text. Matching is performed in your browser against the same 23-skill starter vocabulary used for the preparation plan.</p>
          <textarea value={resume} maxLength={20000} onChange={event=>setResume(event.target.value)} rows={13} placeholder="Paste resume text here…" className="mt-4 w-full resize-y rounded-2xl border border-white/10 bg-[#09090d] p-4 text-sm leading-6 text-zinc-200 outline-none focus:border-violet-400/50"/>
          <p className="mt-2 text-[10px] text-zinc-600">{resume.length.toLocaleString()} / 20,000 characters · Browser-local only</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-2xl font-semibold">{requirements.length}</p><p className="text-[10px] text-zinc-500">Detected in job</p></div>
            <div className="rounded-xl bg-emerald-300/[0.06] p-3"><p className="text-2xl font-semibold text-emerald-200">{matched.length}</p><p className="text-[10px] text-zinc-500">Also in resume</p></div>
            <div className="rounded-xl bg-amber-300/[0.06] p-3"><p className="text-2xl font-semibold text-amber-200">{possibleGaps.length}</p><p className="text-[10px] text-zinc-500">Not detected</p></div>
          </div>
          <div className="mt-5"><p className="text-xs font-semibold text-emerald-200">Terms detected in both</p><div className="mt-2 flex flex-wrap gap-2">{matched.map(skill=><span key={skill.key} className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.06] px-2.5 py-1 text-[10px] text-emerald-100">{skill.label}</span>)}{!matched.length && <span className="text-xs text-zinc-500">No shared terms detected yet.</span>}</div></div>
          <div className="mt-5"><p className="text-xs font-semibold text-amber-200">Job terms not found in resume text</p><div className="mt-2 flex flex-wrap gap-2">{possibleGaps.map(skill=><span key={skill.key} className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-2.5 py-1 text-[10px] text-amber-100">{skill.label}</span>)}{!possibleGaps.length && <span className="text-xs text-zinc-500">No vocabulary gaps detected.</span>}</div></div>
          <p className="mt-5 text-[11px] leading-5 text-zinc-500">A term missing from your resume is not proof you lack that skill. A term found in the resume does not verify proficiency. Add evidence truthfully and review the full job description manually.</p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-violet-300"/><h2 className="font-semibold">Job-specific preparation plan</h2></div><button onClick={()=>void loadPlan(selectedId)} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white" aria-label="Refresh preparation plan"><RefreshCw className="h-4 w-4"/></button></div>
          {plan ? <>
            <p className="mt-2 text-xs text-zinc-500">{plan.job.company} · {plan.job.role}</p>
            <div className="mt-5 flex items-center justify-between text-xs"><span className="text-zinc-400">Checklist progress</span><span className="font-semibold text-violet-200">{progress}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400 transition-all" style={{width:progress+"%"}}/></div>
            <div className="mt-5 space-y-3">{plan.tasks.map(task=>{
              const gap=possibleGaps.some(skill=>skill.key===task.skillKey);
              return <article key={task.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-start gap-3"><div className="mt-0.5 text-violet-300">{task.status==="completed" ? <CheckCircle2 className="h-4 w-4"/> : <ClipboardList className="h-4 w-4"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{task.title}</p><span className={"rounded-full px-2 py-0.5 text-[9px] "+(gap ? "bg-amber-300/10 text-amber-200" : "bg-emerald-300/10 text-emerald-200")}>{resume.trim() ? gap ? "Not found in resume" : "Found in resume" : "Resume not compared"}</span></div><p className="mt-2 text-xs leading-5 text-zinc-500">{task.description}</p><a href={task.module} className="mt-3 inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200">Open practice module <ArrowRight className="h-3 w-3"/></a>
                  <div className="mt-3 flex flex-wrap gap-2"><button disabled={savingId===task.id} onClick={()=>void updateTask(task, task.status==="todo" ? "in_progress" : task.status==="in_progress" ? "completed" : "todo")} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-300 hover:border-violet-400/40 disabled:opacity-40">{savingId===task.id ? "Saving…" : task.status==="todo" ? "Start task" : task.status==="in_progress" ? "Mark complete" : "Reopen task"}</button><span className="self-center text-[10px] text-zinc-600">{task.status.replace("_"," ")}</span></div>
                </div></div>
              </article>;
            })}{!plan.tasks.length && <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">No terms from the starter vocabulary were detected in this job description. Review it manually and use the general preparation modules.</p>}</div>
            <p className="mt-4 text-[10px] leading-5 text-zinc-600">{plan.methodology}</p>
          </> : <div className="py-10 text-center text-sm text-zinc-500"><Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin"/>Building preparation checklist…</div>}
        </section>
      </div>}

      <div className="mt-6 rounded-2xl border border-violet-300/10 bg-violet-400/[0.04] p-5"><p className="flex items-center gap-2 text-xs font-semibold text-violet-200"><ShieldCheck className="h-4 w-4"/> PRIVACY & METHOD</p><p className="mt-2 text-xs leading-5 text-zinc-500">The saved job description and checklist are stored in your account. Resume text is not sent to the API or persisted. The skill detector uses a limited phrase list; this is not an ATS score, skill certification, hiring prediction or guarantee that every job requirement has been captured.</p></div>
    </section>
  </main>;
}

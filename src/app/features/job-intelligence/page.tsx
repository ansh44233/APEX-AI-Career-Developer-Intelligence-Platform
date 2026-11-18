"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, BriefcaseBusiness, ExternalLink, Plus, RefreshCw, Search, Sparkles, Trash2 } from "lucide-react";

type Goal = { id: string; targetRole: string; targetCompany: string | null; status: string };
type Job = { id: string; company: string; role: string; location: string | null; sourceUrl: string | null; jobDescription: string; status: string; appliedAt?: string | null; notes: string | null; goalId: string | null; goal?: { targetRole: string; targetCompany: string | null } | null; createdAt: string; updatedAt: string };
const statuses = ["saved", "applied", "interview", "offer", "rejected", "withdrawn"] as const;
const skills = [
  { name: "JavaScript", terms: ["javascript", "ecmascript"] }, { name: "TypeScript", terms: ["typescript"] },
  { name: "React", terms: ["react", "react.js", "reactjs"] }, { name: "Next.js", terms: ["next.js", "nextjs"] },
  { name: "Node.js", terms: ["node.js", "nodejs"] }, { name: "Python", terms: ["python"] },
  { name: "Java", terms: ["java"] }, { name: "C++", terms: ["c++"] }, { name: "SQL", terms: ["sql", "postgresql", "mysql"] },
  { name: "Data structures", terms: ["data structures", "algorithms", "complexity analysis"] },
  { name: "API design", terms: ["api design", "rest api", "restful", "graphql"] },
  { name: "Databases", terms: ["database", "databases", "mongodb", "redis", "data modelling", "data modeling"] },
  { name: "Testing", terms: ["testing", "unit test", "integration test", "playwright", "jest", "cypress"] },
  { name: "Cloud", terms: ["cloud", "aws", "azure", "gcp", "google cloud"] },
  { name: "Docker", terms: ["docker", "containerization"] }, { name: "Kubernetes", terms: ["kubernetes", "k8s"] },
  { name: "System design", terms: ["system design", "distributed systems", "scalability", "high availability"] },
  { name: "Security", terms: ["security", "authentication", "authorization", "oauth", "owasp"] },
  { name: "Linux", terms: ["linux", "shell scripting"] }, { name: "CI/CD", terms: ["ci/cd", "continuous integration", "continuous deployment"] },
  { name: "Communication", terms: ["communication", "stakeholder management", "cross-functional"] },
];
function hasTerm(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|[^a-z0-9+#])" + escaped + "($|[^a-z0-9+#])", "i").test(text);
}
function analyse(description: string) {
  const found = skills.filter(skill => skill.terms.some(term => hasTerm(description, term)));
  return { found, count: found.length };
}
function practiceHref(skill: string) {
  if (["Data structures", "Python", "Java", "C++"].includes(skill)) return "/features/oa-arena";
  if (["API design", "Databases", "Cloud", "Docker", "Kubernetes", "System design", "Security", "Linux", "CI/CD"].includes(skill)) return "/features/system-design";
  if (skill === "Communication") return "/features/interview-lab";
  return "/features/question-bank";
}
const statusLabel: Record<string, string> = { saved: "Saved", applied: "Applied", interview: "Interview", offer: "Offer", rejected: "Not selected", withdrawn: "Withdrawn" };

export default function JobIntelligencePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");
  const [goalId, setGoalId] = useState("");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [jobResponse, goalResponse] = await Promise.all([fetch("/api/jobs", { cache: "no-store" }), fetch("/api/career-goals", { cache: "no-store" })]);
      if (jobResponse.status === 401 || goalResponse.status === 401) { setError("Sign in to save and track your job applications."); setJobs([]); setGoals([]); return; }
      const [jobData, goalData] = await Promise.all([jobResponse.json(), goalResponse.json()]);
      if (!jobResponse.ok) throw new Error(jobData.error || "Could not load jobs.");
      setJobs(jobData.jobs || []); setGoals(goalData.goals || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load job intelligence."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => jobs.filter(job => (filter === "all" || job.status === filter) && (job.company + " " + job.role + " " + (job.location || "")).toLowerCase().includes(query.toLowerCase().trim())), [jobs, filter, query]);
  const counts = useMemo(() => statuses.reduce((acc, status) => { acc[status] = jobs.filter(job => job.status === status).length; return acc; }, {} as Record<string, number>), [jobs]);

  async function addJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company, role, location: location || null, sourceUrl: sourceUrl || null, jobDescription: description, goalId: goalId || null, notes: notes || null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this job.");
      setCompany(""); setRole(""); setLocation(""); setSourceUrl(""); setDescription(""); setGoalId(""); setNotes("");
      setNotice("Job saved to your tracker."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save this job."); }
    finally { setSaving(false); }
  }
  async function updateStatus(job: Job, status: string) {
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/jobs/" + job.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not update status.");
      setJobs(current => current.map(item => item.id === job.id ? { ...item, status } : item)); setNotice("Application status updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not update status."); }
  }
  async function removeJob(job: Job) {
    if (!window.confirm("Delete this saved job and its notes?")) return;
    try { const response = await fetch("/api/jobs/" + job.id, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not delete job."); setJobs(current => current.filter(item => item.id !== job.id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not delete job."); }
  }

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Dashboard</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/features/company-intelligence" className="text-xs text-zinc-400 hover:text-white">Company Intel <ExternalLink className="ml-1 inline h-3 w-3"/></a>
    </header>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><BriefcaseBusiness className="h-4 w-4"/> APEX INTELLIGENCE / JOB PIPELINE</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Turn job descriptions<br/><span className="text-violet-300">into a preparation plan.</span></h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Save a real listing, map its detected skills, connect it to a career goal and track your application. Add the official job URL so you can return to the original source.</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-white/10 bg-[#111119] p-4"><p className="text-2xl font-semibold">{jobs.length}</p><p className="text-xs text-zinc-500">Tracked jobs</p></div>
        {statuses.map(status => <div key={status} className="rounded-2xl border border-white/10 bg-[#111119] p-4"><p className="text-2xl font-semibold">{counts[status] || 0}</p><p className="text-xs text-zinc-500">{statusLabel[status]}</p></div>)}
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{notice}</p>}

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
        <form onSubmit={addJob} className="h-fit rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><Plus className="h-5 w-5"/></div><div><h2 className="font-semibold">Add a job listing</h2><p className="text-xs text-zinc-500">Paste the description from its source</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-zinc-400">Company<input required maxLength={120} value={company} onChange={e=>setCompany(e.target.value)} placeholder="e.g. Microsoft" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"/></label>
            <label className="text-xs text-zinc-400">Role<input required minLength={2} maxLength={160} value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Software Engineer" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"/></label>
            <label className="text-xs text-zinc-400">Location<input maxLength={120} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Remote / Bengaluru" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"/></label>
            <label className="text-xs text-zinc-400">Official job URL<input type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"/></label>
          </div>
          <label className="mt-3 block text-xs text-zinc-400">Connect to a career goal<select value={goalId} onChange={e=>setGoalId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#171720] px-3 py-2.5 text-sm text-white"><option value="">General job search</option>{goals.filter(goal=>goal.status==="active").map(goal=><option key={goal.id} value={goal.id}>{goal.targetRole}{goal.targetCompany ? " · "+goal.targetCompany : ""}</option>)}</select></label>
          <label className="mt-3 block text-xs text-zinc-400">Job description <span className="text-zinc-600">· 30–20,000 characters</span><textarea required minLength={30} maxLength={20000} rows={8} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Paste responsibilities, qualifications and requirements…" className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-violet-400"/></label>
          <label className="mt-3 block text-xs text-zinc-400">Private notes <textarea maxLength={4000} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Recruiter notes, deadline, referral…" className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400"/></label>
          <button disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50">{saving ? "Saving…" : "Save job & analyse skills"} <Sparkles className="h-4 w-4"/></button>
          <p className="mt-3 text-[11px] leading-5 text-zinc-600">Job details are private to your account. APEX does not crawl job boards or claim these are live vacancies. Skill matching uses a limited built-in vocabulary, not an ATS score.</p>
        </form>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold">Your application pipeline</h2><p className="text-xs text-zinc-500">Up to 100 most recently updated listings</p></div>
            <button onClick={()=>void load()} className="flex items-center gap-2 self-start rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"><RefreshCw className="h-3.5 w-3.5"/> Refresh</button>
          </div>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search company, role or location" className="w-full rounded-xl border border-white/10 bg-[#111119] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-400"/></div>
            <select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#111119] px-3 py-2.5 text-sm text-zinc-200"><option value="all">All statuses</option>{statuses.map(status=><option key={status} value={status}>{statusLabel[status]}</option>)}</select>
          </div>
          {loading ? <div className="rounded-2xl border border-white/10 bg-[#111119] p-8 text-center text-sm text-zinc-500">Loading your job pipeline…</div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-[#111119]/60 p-8 text-center"><BriefcaseBusiness className="mx-auto h-8 w-8 text-zinc-600"/><p className="mt-3 text-sm font-medium text-zinc-300">{jobs.length ? "No jobs match this filter." : "Your job pipeline is empty."}</p><p className="mt-1 text-xs text-zinc-500">Save a listing with its job description to start building your preparation map.</p></div> :
            <div className="space-y-3">{filtered.map(job => {
              const analysis = analyse(job.jobDescription);
              const detectedNames = new Set(analysis.found.map(item=>item.name));
              const notInDescription = skills.filter(item=>!detectedNames.has(item.name));
              return <article key={job.id} className="rounded-2xl border border-white/10 bg-[#111119] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="font-semibold text-white">{job.role}</h3><p className="mt-1 text-sm text-violet-200">{job.company}{job.location ? <span className="text-zinc-500"> · {job.location}</span> : null}</p><p className="mt-1 text-[11px] text-zinc-600">{job.goal ? "Goal: "+job.goal.targetRole+(job.goal.targetCompany ? " · "+job.goal.targetCompany : "") : "General job search"} · Updated {new Date(job.updatedAt).toLocaleDateString()}</p></div>
                  <div className="flex items-center gap-2"><select aria-label={"Application status for "+job.company} value={job.status} onChange={e=>void updateStatus(job,e.target.value)} className="max-w-[145px] rounded-lg border border-white/10 bg-[#1a1a24] px-2 py-2 text-xs text-zinc-200">{statuses.map(status=><option key={status} value={status}>{statusLabel[status]}</option>)}</select><button onClick={()=>void removeJob(job)} aria-label={"Delete "+job.company+" job"} className="rounded-lg border border-white/10 p-2 text-zinc-500 hover:border-rose-400/30 hover:text-rose-300"><Trash2 className="h-4 w-4"/></button></div>
                </div>
                <div className="mt-4 rounded-xl bg-black/25 p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-medium text-zinc-300">Description vocabulary match</p><p className="text-xs tabular-nums text-violet-200">{analysis.count} / {skills.length} skill areas detected</p></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-400" style={{width:(analysis.count/skills.length*100)+"%"}}/></div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{analysis.found.slice(0,12).map(item=><a key={item.name} href={practiceHref(item.name)} className="rounded-md border border-emerald-400/15 bg-emerald-400/5 px-2 py-1 text-[10px] text-emerald-200 hover:border-violet-400/40 hover:text-white">{item.name} ↗</a>)}{analysis.count===0 && <span className="text-xs text-zinc-500">No terms from the starter vocabulary detected.</span>}</div>
                  <p className="mt-3 text-[10px] leading-4 text-zinc-600">Vocabulary not found in this description: {notInDescription.slice(0,8).map(item=>item.name).join(", ") || "none from the starter vocabulary"}. This does not establish your proficiency or disqualify you from the role.</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">{job.sourceUrl && <a href={job.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-300 hover:text-violet-200">Open original listing <ExternalLink className="ml-1 inline h-3 w-3"/></a>}<a href={"/features/resume-intelligence"} className="text-xs text-zinc-400 hover:text-white">Compare resume</a><a href={"/features/interview-prep"} className="text-xs text-zinc-400 hover:text-white">Interview prep</a></div>
              </article>;
            })}</div>}
        </section>
      </div>
    </section>
  </main>;
}

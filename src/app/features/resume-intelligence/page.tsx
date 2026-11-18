"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ClipboardCheck, FileText, Info, ScanSearch, ShieldCheck, Target } from "lucide-react";

type Skill = { key: string; label: string; aliases: string[]; module: string; action: string };
const skills: Skill[] = [
  { key: "javascript", label: "JavaScript", aliases: ["javascript", " js "], module: "/features/oa-arena", action: "Practise language fundamentals and problem-solving exercises." },
  { key: "typescript", label: "TypeScript", aliases: ["typescript", " ts "], module: "/features/oa-arena", action: "Practise types, narrowing, generics and async code." },
  { key: "react", label: "React", aliases: ["react", "react.js", "reactjs"], module: "/features/project-defense", action: "Build and explain component state, data flow and accessibility." },
  { key: "nextjs", label: "Next.js", aliases: ["next.js", "nextjs"], module: "/features/project-defense", action: "Review routing, rendering, server/client boundaries and caching." },
  { key: "node", label: "Node.js", aliases: ["node.js", "nodejs"], module: "/features/system-design", action: "Review runtime fundamentals, API design and service boundaries." },
  { key: "python", label: "Python", aliases: ["python"], module: "/features/oa-arena", action: "Practise Python fundamentals and data-structure problems." },
  { key: "java", label: "Java", aliases: ["java"], module: "/features/oa-arena", action: "Practise Java fundamentals, collections and problem solving." },
  { key: "sql", label: "SQL", aliases: ["sql", "postgresql", "mysql"], module: "/features/oa-arena", action: "Practise joins, aggregation, indexes and query reasoning." },
  { key: "api", label: "API design", aliases: ["api design", "rest api", "restful", "graphql"], module: "/features/system-design", action: "Design endpoints, validation, errors, pagination and authorization." },
  { key: "databases", label: "Databases", aliases: ["database", "databases", "data modelling", "data modeling", "mongodb", "redis"], module: "/features/system-design", action: "Review data modelling, indexing, transactions and consistency." },
  { key: "testing", label: "Testing", aliases: ["testing", "unit test", "integration test", "jest", "playwright", "cypress"], module: "/features/project-defense", action: "Create a test strategy and explain edge cases." },
  { key: "cloud", label: "Cloud", aliases: ["cloud", "aws", "azure", "google cloud", "gcp"], module: "/features/system-design", action: "Review cloud primitives, deployment and reliability trade-offs." },
  { key: "docker", label: "Docker", aliases: ["docker", "containerization", "containers"], module: "/features/system-design", action: "Explain images, containers, networking and deployment workflow." },
  { key: "kubernetes", label: "Kubernetes", aliases: ["kubernetes", "k8s"], module: "/features/system-design", action: "Review orchestration concepts and service health." },
  { key: "ci_cd", label: "CI / CD", aliases: ["ci/cd", "continuous integration", "continuous delivery", "continuous deployment"], module: "/features/project-defense", action: "Describe a safe build, test, release and rollback pipeline." },
  { key: "linux", label: "Linux", aliases: ["linux", "unix"], module: "/features/oa-arena", action: "Practise shell, processes, permissions and filesystem fundamentals." },
  { key: "networking", label: "Networking", aliases: ["networking", "tcp/ip", "dns", "http/https"], module: "/features/system-design", action: "Explain DNS, HTTP, TCP and common network failure modes." },
  { key: "system_design", label: "System design", aliases: ["system design", "distributed systems", "scalability", "high availability"], module: "/features/system-design", action: "Practise requirements, architecture, bottlenecks and trade-offs." },
  { key: "security", label: "Security", aliases: ["security", "authentication", "authorization", "oauth", "owasp"], module: "/features/system-design", action: "Review identity, access control, input validation and common risks." },
  { key: "git", label: "Git", aliases: ["git", "github", "version control"], module: "/features/project-defense", action: "Explain branching, reviews, conflict resolution and collaboration." },
  { key: "communication", label: "Communication", aliases: ["communication", "stakeholder management", "cross-functional"], module: "/features/interview-lab", action: "Practise concise technical and behavioural explanations." },
  { key: "leadership", label: "Leadership", aliases: ["leadership", "mentoring", "team leadership"], module: "/features/interview-lab", action: "Prepare truthful examples of ownership, collaboration and mentoring." },
  { key: "problem_solving", label: "Problem solving", aliases: ["problem solving", "analytical thinking", "critical thinking"], module: "/features/oa-arena", action: "Practise structured approaches and explain trade-offs." },
];

function containsTerm(text: string, term: string) {
  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|[^a-z0-9+#])" + escaped + "($|[^a-z0-9+#])", "i").test(text);
}
function detected(skill: Skill, text: string) {
  return skill.aliases.some((alias) => containsTerm(text, alias.trim()));
}

export default function ResumeIntel() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [checked, setChecked] = useState(false);
  const result = useMemo(() => {
    const resumeText = resume.toLowerCase();
    const jobText = job.toLowerCase();
    const requirements = skills.filter((skill) => detected(skill, jobText));
    const matched = requirements.filter((skill) => detected(skill, resumeText));
    const missing = requirements.filter((skill) => !detected(skill, resumeText));
    const resumeWords = resume.trim() ? resume.trim().split(/\s+/).length : 0;
    const bullets = resume.split("\n").filter((line) => /^\s*[-•*]/.test(line)).length;
    return { requirements, matched, missing, resumeWords, bullets };
  }, [resume, job]);

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> APEX home</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a>
    </header>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
      <div className="mb-10">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><ScanSearch className="h-4 w-4"/> FEATURE EXPERIENCE / 04</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Resume Intelligence</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">Understand a target role, find skill terms that appear in your resume, and turn possible gaps into practical preparation steps.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-7">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-violet-300"/><h2 className="font-semibold">Your resume text</h2></div>
          <p className="mt-2 text-xs text-zinc-500">Paste text only. This tool analyses it in your browser and does not upload or store it.</p>
          <textarea value={resume} maxLength={20000} onChange={e=>{setResume(e.target.value);setChecked(false);}} placeholder="Paste the text from your resume..." className="mt-4 min-h-56 w-full rounded-2xl border border-white/10 bg-[#09090d] p-4 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-400/50"/>
          <label htmlFor="job" className="mt-6 flex items-center gap-2 text-xs font-semibold text-zinc-300"><BriefcaseBusiness className="h-4 w-4 text-violet-300"/> TARGET JOB DESCRIPTION</label>
          <textarea id="job" value={job} maxLength={20000} onChange={e=>{setJob(e.target.value);setChecked(false);}} placeholder="Paste the job description here..." className="mt-3 min-h-48 w-full rounded-2xl border border-white/10 bg-[#09090d] p-4 text-sm leading-6 text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-400/50"/>
          <div className="mt-2 flex justify-between text-[10px] text-zinc-600"><span>Both fields are processed locally</span><span>{job.length.toLocaleString()} / 20,000</span></div>
          <button onClick={()=>setChecked(true)} disabled={!resume.trim() || !job.trim()} className="mt-5 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold hover:bg-violet-400 disabled:opacity-40"><ClipboardCheck className="mr-2 inline h-4 w-4"/> Analyse role fit</button>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
            <div className="flex items-center gap-2"><Target className="h-4 w-4 text-violet-300"/><h3 className="font-semibold">Job description analysis</h3></div>
            {checked ? <>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-2xl font-semibold">{result.requirements.length}</p><p className="mt-1 text-[10px] text-zinc-500">Terms detected</p></div>
                <div className="rounded-xl bg-emerald-300/[0.06] p-3"><p className="text-2xl font-semibold text-emerald-200">{result.matched.length}</p><p className="mt-1 text-[10px] text-zinc-500">In resume</p></div>
                <div className="rounded-xl bg-amber-300/[0.06] p-3"><p className="text-2xl font-semibold text-amber-200">{result.missing.length}</p><p className="mt-1 text-[10px] text-zinc-500">Not detected</p></div>
              </div>
              <p className="mt-6 text-xs font-semibold text-zinc-300">Detected requirements</p>
              <div className="mt-3 flex flex-wrap gap-2">{result.requirements.length ? result.requirements.map(skill=><span key={skill.key} className={"rounded-full border px-2.5 py-1 text-[10px] " + (result.matched.some(item=>item.key===skill.key) ? "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200" : "border-amber-300/20 bg-amber-300/[0.06] text-amber-200")}>{skill.label}</span>) : <span className="text-xs text-zinc-500">No terms from the current built-in skill list were detected. Try a fuller description.</span>}</div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xl font-semibold">{result.resumeWords}</p><p className="text-[10px] text-zinc-500">Resume words</p></div>
                <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xl font-semibold">{result.bullets}</p><p className="text-[10px] text-zinc-500">Bullet lines</p></div>
              </div>
              <p className="mt-5 text-[11px] leading-5 text-zinc-500">“Not detected” means the matching terms were not found in the pasted resume. It does not prove you lack that skill. Add truthful evidence where relevant.</p>
            </> : <p className="mt-5 text-sm leading-6 text-zinc-500">Paste both texts and analyse to see detected job requirements, matching resume terms and possible gaps.</p>}
          </section>

          {checked && <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
            <h3 className="font-semibold">Suggested preparation steps</h3>
            <p className="mt-2 text-xs leading-5 text-zinc-500">Based on terms not detected in your resume. These are practice ideas, not a judgement of your ability.</p>
            <div className="mt-4 space-y-3">{result.missing.slice(0,6).map(skill=><div key={skill.key} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{skill.label}</p><a href={skill.module} className="shrink-0 text-xs text-violet-300 hover:text-violet-200">Practise <ArrowRight className="ml-1 inline h-3 w-3"/></a></div><p className="mt-2 text-xs leading-5 text-zinc-500">{skill.action}</p></div>)}
              {!result.missing.length && <p className="text-xs text-zinc-500">No gaps from this limited built-in vocabulary were detected. Review the full job description manually too.</p>}
            </div>
          </section>}

          <div className="rounded-2xl border border-violet-300/10 bg-violet-400/[0.04] p-5"><p className="flex items-center gap-2 text-xs font-semibold text-violet-200"><ShieldCheck className="h-4 w-4"/> PRIVATE BY DESIGN</p><p className="mt-3 text-xs leading-5 text-zinc-500">The analysis runs locally in this page. Text is not sent to an API, saved to your account or shared with an AI provider.</p></div>
          <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-5"><p className="flex items-center gap-2 text-xs font-semibold text-amber-200"><Info className="h-4 w-4"/> IMPORTANT LIMITS</p><p className="mt-2 text-xs leading-5 text-zinc-500">This is phrase matching against a small built-in vocabulary. It can miss synonyms and context, and a detected word does not verify experience. No ATS score, AI review, PDF parsing or hiring prediction is provided.</p></div>
        </aside>
      </div>
    </section>
  </main>;
}

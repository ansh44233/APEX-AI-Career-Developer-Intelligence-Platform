"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Check, Copy, Info, ShieldCheck, Sparkles } from "lucide-react";

const companies = [
  { name: "Google", focus: "Software Engineering", signals: ["Data structures and algorithms", "Problem solving and clear communication", "Role-specific technical depth"], prep: ["Practise arrays, trees, graphs and dynamic programming", "Explain complexity and trade-offs aloud", "Prepare concise examples of collaboration and impact"], note: "Illustrative preparation guide. Verify current roles and hiring details on the company's official careers site." },
  { name: "Microsoft", focus: "Software Engineering", signals: ["Coding fundamentals and problem solving", "Design and maintainable engineering", "Collaboration and growth mindset"], prep: ["Practise common data structures and algorithms", "Discuss design choices and edge cases", "Prepare examples showing learning and teamwork"], note: "Illustrative preparation guide. Interview processes vary by team, level and location." },
  { name: "Amazon", focus: "Software Development", signals: ["Data structures and coding", "System design for relevant levels", "Leadership principles and behavioural examples"], prep: ["Practise coding with clear test cases", "Prepare structured STAR stories", "Explain ownership, customer focus and trade-offs"], note: "Illustrative preparation guide. Confirm role-specific expectations through official job listings." },
];

const vocabulary = [
  { label: "JavaScript", terms: ["javascript", "js"] }, { label: "TypeScript", terms: ["typescript"] },
  { label: "React", terms: ["react", "react.js", "reactjs"] }, { label: "Next.js", terms: ["next.js", "nextjs"] },
  { label: "Node.js", terms: ["node.js", "nodejs"] }, { label: "Python", terms: ["python"] },
  { label: "Java", terms: ["java"] }, { label: "SQL", terms: ["sql", "postgresql", "mysql"] },
  { label: "API design", terms: ["api design", "rest api", "restful", "graphql"] },
  { label: "Databases", terms: ["database", "databases", "mongodb", "redis", "data modelling", "data modeling"] },
  { label: "Testing", terms: ["testing", "unit test", "integration test", "jest", "playwright", "cypress"] },
  { label: "Cloud", terms: ["cloud", "aws", "azure", "google cloud", "gcp"] },
  { label: "Docker", terms: ["docker", "containerization", "containers"] },
  { label: "Kubernetes", terms: ["kubernetes", "k8s"] },
  { label: "CI / CD", terms: ["ci/cd", "continuous integration", "continuous delivery", "continuous deployment"] },
  { label: "Linux", terms: ["linux", "unix"] },
  { label: "Networking", terms: ["networking", "tcp/ip", "dns", "http/https"] },
  { label: "System design", terms: ["system design", "distributed systems", "scalability", "high availability"] },
  { label: "Security", terms: ["security", "authentication", "authorization", "oauth", "owasp"] },
  { label: "Git", terms: ["git", "github", "version control"] },
  { label: "Communication", terms: ["communication", "stakeholder management", "cross-functional"] },
  { label: "Leadership", terms: ["leadership", "mentoring", "team leadership"] },
  { label: "Problem solving", terms: ["problem solving", "analytical thinking", "critical thinking"] },
];
const actions: Record<string, { module: string; advice: string }> = {
  "JavaScript": { module: "/features/oa-arena", advice: "Practise language fundamentals, async behaviour and coding problems." },
  "TypeScript": { module: "/features/oa-arena", advice: "Review types, narrowing, generics and typed API boundaries." },
  "React": { module: "/features/project-defense", advice: "Explain component state, data flow, accessibility and performance." },
  "Next.js": { module: "/features/project-defense", advice: "Review routing, rendering and server/client boundaries." },
  "Node.js": { module: "/features/system-design", advice: "Review runtime fundamentals, API design and service boundaries." },
  "Python": { module: "/features/oa-arena", advice: "Practise Python fundamentals and data-structure problems." },
  "Java": { module: "/features/oa-arena", advice: "Practise Java collections, language fundamentals and problem solving." },
  "SQL": { module: "/features/oa-arena", advice: "Practise joins, aggregation, window functions and query reasoning." },
  "API design": { module: "/features/system-design", advice: "Design endpoints, validation, errors, pagination and authorization." },
  "Databases": { module: "/features/system-design", advice: "Review data modelling, indexes, transactions and consistency." },
  "Testing": { module: "/features/project-defense", advice: "Create a test strategy and explain edge cases." },
  "Cloud": { module: "/features/system-design", advice: "Review cloud primitives, deployment and reliability trade-offs." },
  "Docker": { module: "/features/system-design", advice: "Explain images, containers, networking and deployment workflow." },
  "Kubernetes": { module: "/features/system-design", advice: "Review orchestration concepts and service health." },
  "CI / CD": { module: "/features/project-defense", advice: "Describe a safe build, test, release and rollback pipeline." },
  "Linux": { module: "/features/oa-arena", advice: "Practise shell, processes, permissions and filesystem fundamentals." },
  "Networking": { module: "/features/system-design", advice: "Explain DNS, HTTP, TCP and common network failure modes." },
  "System design": { module: "/features/system-design", advice: "Practise requirements, architecture, bottlenecks and trade-offs." },
  "Security": { module: "/features/system-design", advice: "Review identity, access control, input validation and common risks." },
  "Git": { module: "/features/project-defense", advice: "Explain branching, reviews, conflict resolution and collaboration." },
  "Communication": { module: "/features/interview-lab", advice: "Practise concise technical and behavioural explanations." },
  "Leadership": { module: "/features/interview-lab", advice: "Prepare truthful examples of ownership, collaboration and mentoring." },
  "Problem solving": { module: "/features/oa-arena", advice: "Practise structured approaches and explain trade-offs." },
};
function hasTerm(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|[^a-z0-9+#])" + escaped + "($|[^a-z0-9+#])", "i").test(text);
}

export default function CompanyIntel() {
  const [company, setCompany] = useState("Google");
  const [role, setRole] = useState("Software Engineering");
  const [notes, setNotes] = useState("");
  const [job, setJob] = useState("");
  const [copied, setCopied] = useState(false);
  const active = useMemo(() => companies.find(c => c.name === company) || companies[0], [company]);
  const detected = useMemo(() => vocabulary.filter(item => item.terms.some(term => hasTerm(job.toLowerCase(), term))), [job]);
  const copyPlan = async () => {
    const lines = [
      company + " · " + role,
      "Company preparation themes (illustrative)",
      ...active.signals.map(x => "• " + x),
      "Job description terms detected locally",
      ...(detected.length ? detected.map(x => "• " + x.label) : ["• No terms from the built-in vocabulary detected"]),
      "Suggested preparation",
      ...detected.map(x => "• " + x.label + ": " + actions[x.label].advice),
      "Personal research notes",
      notes || "None added",
      "Reminder: verify current requirements on the official careers listing."
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> APEX home</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a>
    </header>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
      <div className="mb-10">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><Building2 className="h-4 w-4"/> FEATURE EXPERIENCE / 03</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Company Intelligence</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">Build a focused preparation brief by combining a company, target role and job description. Your pasted text stays in this browser page.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="rounded-3xl border border-white/10 bg-[#111119] p-5">
          <p className="text-xs font-semibold tracking-wider text-zinc-400">BUILD YOUR COMPANY BRIEF</p>
          <label className="mt-6 block text-xs text-zinc-400" htmlFor="company">Company profile</label>
          <select id="company" value={company} onChange={e=>{setCompany(e.target.value);setCopied(false);}} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm text-white outline-none focus:border-violet-400/50">{companies.map(c=><option key={c.name}>{c.name}</option>)}</select>
          <label className="mt-5 block text-xs text-zinc-400" htmlFor="role">Target role</label>
          <input id="role" maxLength={100} value={role} onChange={e=>{setRole(e.target.value);setCopied(false);}} placeholder="e.g. Backend Engineer" className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm text-white outline-none focus:border-violet-400/50"/>
          <label className="mt-5 flex items-center gap-2 text-xs text-zinc-400" htmlFor="job"><BriefcaseBusiness className="h-4 w-4 text-violet-300"/> JOB DESCRIPTION</label>
          <textarea id="job" maxLength={20000} value={job} onChange={e=>{setJob(e.target.value);setCopied(false);}} placeholder="Paste the job description to detect skill terms..." className="mt-2 min-h-44 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/50"/>
          <p className="mt-1 text-right text-[10px] text-zinc-600">{job.length.toLocaleString()} / 20,000</p>
          <label className="mt-5 block text-xs text-zinc-400" htmlFor="research">Research notes</label>
          <textarea id="research" maxLength={5000} value={notes} onChange={e=>{setNotes(e.target.value);setCopied(false);}} placeholder="Add questions, official job links or details you want to verify..." className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/50"/>
          <button onClick={copyPlan} className="mt-5 w-full rounded-xl bg-violet-500 px-4 py-3 text-xs font-semibold hover:bg-violet-400"><Copy className="mr-2 inline h-4 w-4"/> {copied ? "Brief copied" : "Copy preparation brief"}</button>
        </aside>

        <div className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/10 text-violet-200"><BriefcaseBusiness className="h-5 w-5"/></span><div><h2 className="text-xl font-semibold">{company}</h2><p className="mt-1 text-xs text-zinc-500">{role || "Target role"} · {active.focus}</p></div></div>
              <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.05] px-3 py-1.5 text-[10px] text-amber-200">Illustrative company guide</span>
            </div>
            <p className="mt-6 text-xs font-semibold tracking-wider text-zinc-400">GENERAL PREPARATION THEMES</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">{active.signals.map(s=><li key={s} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-zinc-300"><Check className="h-4 w-4 shrink-0 text-violet-300"/>{s}</li>)}</ul>
            <p className="mt-4 text-xs leading-5 text-zinc-500">{active.note}</p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-300"/><h3 className="font-semibold">Job-specific preparation signals</h3></div><span className="text-[10px] text-zinc-500">{detected.length} terms detected</span></div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">Matched locally against a limited vocabulary. These are extracted text signals, not verified company requirements.</p>
            {detected.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{detected.map(item=><div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="text-sm font-medium">{item.label}</p><p className="mt-2 text-xs leading-5 text-zinc-500">{actions[item.label].advice}</p><a href={actions[item.label].module} className="mt-3 inline-flex items-center text-xs text-violet-300 hover:text-violet-200">Open practice module <ArrowRight className="ml-1 h-3 w-3"/></a></div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-xs text-zinc-500">Paste a job description to identify terms from the built-in vocabulary. If none appear, review the description manually.</p>}
          </section>

          <div className="rounded-2xl border border-violet-300/10 bg-violet-400/[0.04] p-5"><p className="flex items-center gap-2 text-xs font-semibold text-violet-200"><ShieldCheck className="h-4 w-4"/> PRIVATE BY DESIGN</p><p className="mt-3 text-xs leading-5 text-zinc-500">Job-description text and research notes remain in this page's local state. They are not submitted to an API or saved to your account.</p></div>
          <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-5"><p className="flex items-center gap-2 text-xs font-semibold text-amber-200"><Info className="h-4 w-4"/> DATA TRANSPARENCY</p><p className="mt-2 text-xs leading-5 text-zinc-500">Company themes are fixed illustrative examples for Google, Microsoft and Amazon. No live hiring data, vacancy status, interview loop or company-specific job requirement is fetched or verified. Always check the official job listing.</p></div>
        </div>
      </div>
    </section>
  </main>;
}

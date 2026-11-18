"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Building2, Check, Copy, ExternalLink, Filter, GraduationCap, Search, ShieldCheck, Sparkles } from "lucide-react";
import { companyDirectory, companyRoles } from "@/lib/company-directory";
import { CompanyEvidencePanel } from "@/components/company-evidence-panel";
import { CompanyResearchProfilePanel } from "@/components/company-research-profile-panel";

const categories = ["All companies", "Global technology", "India technology", "Enterprise software"] as const;
const levels = ["Internship", "Entry level / Graduate", "1–3 years", "3–6 years", "6+ years"] as const;
const skillTerms = [
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
  { label: "System design", terms: ["system design", "distributed systems", "scalability", "high availability"] },
  { label: "Security", terms: ["security", "authentication", "authorization", "oauth", "owasp"] },
  { label: "Networking", terms: ["networking", "tcp/ip", "dns", "http/https"] },
  { label: "Communication", terms: ["communication", "stakeholder management", "cross-functional"] },
  { label: "Leadership", terms: ["leadership", "mentoring", "team leadership"] },
];
const roleGuidance: Record<string, string[]> = {
  "Software Engineer": ["Review data structures, algorithms and complexity", "Practise debugging, testing and code quality", "Explain design decisions and trade-offs"],
  "Frontend Engineer": ["JavaScript, TypeScript and browser fundamentals", "React state, rendering, accessibility and performance", "Frontend testing and API integration"],
  "Backend Engineer": ["API design, databases and data modelling", "Concurrency, caching and distributed-system basics", "Authentication, authorization and observability"],
  "Full-Stack Engineer": ["Frontend architecture and accessible user experiences", "Backend APIs, persistence and validation", "End-to-end testing and deployment fundamentals"],
  "Data Engineer": ["SQL, data modelling and query optimisation", "Batch/stream processing and data quality", "Pipeline reliability and cloud fundamentals"],
  "Data Scientist": ["Statistics, probability and experimental reasoning", "Python, SQL and data preparation", "Model evaluation, leakage and communication"],
  "DevOps / Platform Engineer": ["Linux, networking and scripting fundamentals", "CI/CD, containers and infrastructure concepts", "Monitoring, incident response and reliability"],
  "Mobile Engineer": ["Language and platform fundamentals", "UI lifecycle, state and offline behaviour", "Testing, performance and release workflows"],
  "QA / Test Engineer": ["Test design, boundary cases and risk-based coverage", "Automation, API testing and debugging", "CI integration and defect communication"],
  "Security Engineer": ["Identity, access control and secure design", "Threat modelling and common application risks", "Logging, incident response and defensive testing"],
  "Product Manager": ["Product sense, user problems and prioritisation", "Metrics, experimentation and trade-off reasoning", "Stakeholder communication and execution"],
};
const levelGuidance: Record<(typeof levels)[number], string[]> = {
  "Internship": ["Prioritise core CS concepts and learn to explain your reasoning while solving problems", "Use coursework and personal projects to demonstrate curiosity, iteration and fundamentals", "Ask clarifying questions and show how you respond to feedback"],
  "Entry level / Graduate": ["Strengthen data structures, algorithms, databases and language fundamentals", "Prepare clear walkthroughs of projects, decisions, testing and lessons learned", "Practise communicating a structured approach before coding"],
  "1–3 years": ["Show end-to-end ownership of features, from requirements through testing and release", "Bring concrete examples of debugging, production learning and collaboration", "Explain practical design trade-offs without overengineering"],
  "3–6 years": ["Demonstrate ownership of services or substantial project areas and measurable outcomes", "Explain architecture, reliability, performance and maintainability trade-offs", "Prepare examples of mentoring, technical influence and cross-team delivery"],
  "6+ years": ["Connect technical strategy to product, customer and organisational outcomes", "Discuss architecture evolution, risk management and operational decision-making", "Show how you raise engineering quality through technical leadership and coaching"],
};
const practiceLinks: Record<string, string> = {
  JavaScript: "/features/question-bank", TypeScript: "/features/question-bank", React: "/features/question-bank",
  "Next.js": "/features/question-bank", "Node.js": "/features/question-bank", Python: "/features/oa-arena",
  Java: "/features/oa-arena", SQL: "/features/question-bank", "API design": "/features/system-design",
  Databases: "/features/question-bank", Testing: "/features/project-defense", Cloud: "/features/system-design",
  Docker: "/features/system-design", Kubernetes: "/features/system-design", "System design": "/features/system-design",
  Security: "/features/question-bank", Networking: "/features/question-bank", Communication: "/features/interview-lab",
  Leadership: "/features/interview-lab",
};
function containsTerm(text: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp("(^|[^a-z0-9+#])" + escaped + "($|[^a-z0-9+#])", "i").test(text);
}

export default function CompanyIntel() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All companies");
  const [selectedName, setSelectedName] = useState("Google");
  const [role, setRole] = useState("Software Engineer");
  const [level, setLevel] = useState<(typeof levels)[number]>("Entry level / Graduate");
  const [job, setJob] = useState("");
  const [researchNotes, setResearchNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => companyDirectory.filter(company => {
    const matchesCategory = category === "All companies" || company.category === category;
    const matchesQuery = (company.name + " " + company.focus + " " + company.category).toLowerCase().includes(query.toLowerCase().trim());
    return matchesCategory && matchesQuery;
  }), [category, query]);
  const active = companyDirectory.find(company => company.name === selectedName) ?? companyDirectory[0];
  const detected = useMemo(() => skillTerms.filter(item => item.terms.some(term => containsTerm(job.toLowerCase(), term))), [job]);

  const copyPlan = async () => {
    const lines = [
      "APEX · Company preparation plan",
      active.name + " · " + role + " · " + level,
      "Official company careers page: " + active.careersUrl,
      ...(active.officialInterviewUrl ? ["Official interview resource: " + active.officialInterviewLabel, active.officialInterviewUrl, "Check the source publication date and applicability; an official link is not automatically current guidance."] : ["No dedicated official interview-guidance link is currently listed for this company."]),
      "",
      "Preparation blueprint (APEX-authored; not a confirmed company interview loop)",
      ...active.prepAreas.map(item => "• Company context: " + item),
      ...roleGuidance[role].map(item => "• Role focus: " + item),
      ...levelGuidance[level].map(item => "• Level focus: " + item),
      "",
      "Job-description terms detected locally",
      ...(detected.length ? detected.map(item => "• " + item.label) : ["• No terms from the built-in vocabulary detected"]),
      "",
      "Research notes",
      researchNotes || "None added",
      "",
      "Verify current role requirements and interview format with the official job listing or recruiter. APEX practice topics are not official or leaked interview questions.",
    ];
    try { await navigator.clipboard.writeText(lines.join("\n")); setCopied(true); }
    catch { setCopied(false); }
  };

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Dashboard</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/features/question-bank" className="text-xs text-zinc-400 hover:text-white">Question Bank <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a>
    </header>

    <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
      <div className="mb-9">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><Building2 className="h-4 w-4"/> APEX INTELLIGENCE / COMPANY DIRECTORY</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Know the company.<br/><span className="text-violet-300">Prepare for the role.</span></h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">Explore company career portals, choose a target role and build a preparation plan connected to APEX practice modules. Company facts and APEX-authored preparation ideas are kept clearly separate.</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#111119] p-4"><p className="text-2xl font-semibold">{companyDirectory.length}</p><p className="mt-1 text-xs text-zinc-500">Companies in this starter directory</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#111119] p-4"><p className="text-2xl font-semibold">{companyRoles.length}</p><p className="mt-1 text-xs text-zinc-500">Role tracks</p></div>
        <div className="rounded-2xl border border-white/10 bg-[#111119] p-4"><p className="text-2xl font-semibold">Source-aware</p><p className="mt-1 text-xs text-zinc-500">Official links separated from prep guidance</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Explore companies</h2><span className="text-[10px] text-zinc-500">{filtered.length} results</span></div>
          <div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search companies or focus areas" className="w-full rounded-xl border border-white/10 bg-[#09090d] py-3 pl-10 pr-3 text-sm outline-none focus:border-violet-400/50"/></div>
          <div className="mt-3 flex flex-wrap gap-2">{categories.map(item=><button key={item} onClick={()=>setCategory(item)} className={`rounded-full border px-3 py-1.5 text-[10px] transition ${category===item ? "border-violet-300/40 bg-violet-400/10 text-violet-200" : "border-white/10 text-zinc-500 hover:text-white"}`}><Filter className="mr-1 inline h-3 w-3"/>{item}</button>)}</div>
          <div className="mt-5 max-h-[650px] space-y-2 overflow-y-auto pr-1">
            {filtered.map(company=><button key={company.name} onClick={()=>{setSelectedName(company.name);setCopied(false);}} className={`w-full rounded-2xl border p-4 text-left transition ${selectedName===company.name ? "border-violet-300/30 bg-violet-400/[0.08]" : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]"}`}>
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{company.name}</span>{selectedName===company.name && <Check className="h-4 w-4 text-violet-300"/>}</div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{company.focus}</p>
              <span className="mt-2 inline-block text-[9px] uppercase tracking-wider text-zinc-600">{company.category}</span>
            </button>)}
            {filtered.length===0 && <p className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-zinc-500">No company matches this search. Try a shorter name or another category.</p>}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-[10px] font-semibold tracking-[0.18em] text-violet-300">COMPANY PROFILE</p><h2 className="mt-2 text-2xl font-semibold">{active.name}</h2><p className="mt-2 text-sm text-zinc-500">{active.focus}</p></div>
              <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.05] px-3 py-1.5 text-[10px] text-emerald-200"><BadgeCheck className="mr-1 inline h-3 w-3"/> Official careers link</span>
            </div>
            <a href={active.careersUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-medium text-violet-200 hover:bg-white/[0.06]">Visit official careers page <ExternalLink className="h-3.5 w-3.5"/></a>
            {active.officialInterviewUrl && <div className="mt-4 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><ShieldCheck className="h-4 w-4"/> Official interview resource available</p><a href={active.officialInterviewUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-300 underline decoration-zinc-600 underline-offset-4">{active.officialInterviewLabel} <ExternalLink className="h-3 w-3"/></a></div>}
          </section>

          <CompanyResearchProfilePanel company={active.name} />

          <CompanyEvidencePanel company={active.name} role={role} />

          <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
            <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-violet-300"/><h3 className="font-semibold">Build your role preparation</h3></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-zinc-400">Target role<select value={role} onChange={e=>{setRole(e.target.value);setCopied(false);}} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm text-white outline-none">{companyRoles.map(item=><option key={item}>{item}</option>)}</select></label>
              <label className="text-xs text-zinc-400">Experience level<select value={level} onChange={e=>{setLevel(e.target.value as (typeof levels)[number]);setCopied(false);}} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm text-white outline-none">{levels.map(item=><option key={item}>{item}</option>)}</select></label>
            </div>
            <p className="mt-5 text-[10px] font-semibold tracking-wider text-zinc-500">APEX PREPARATION BLUEPRINT · NOT A VERIFIED COMPANY INTERVIEW LOOP</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{active.prepAreas.map((item,index)=><div key={item} className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-xs leading-5 text-zinc-300"><span className="text-violet-300">0{index+1}</span>{item}</div>)}</div>
            <div className="mt-4 rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4"><p className="text-[10px] font-semibold tracking-wider text-violet-200">LEVEL-SPECIFIC FOCUS · APEX GUIDANCE</p><ul className="mt-2 space-y-2">{levelGuidance[level].map(item=><li key={item} className="flex gap-2 text-xs leading-5 text-zinc-300"><span className="text-violet-300">•</span>{item}</li>)}</ul><p className="mt-2 text-[10px] leading-4 text-zinc-600">General preparation guidance only; actual expectations depend on the vacancy and team.</p></div>
            <div className="mt-5 flex flex-wrap gap-2"><a href={"/features/question-bank?company=" + encodeURIComponent(active.name) + "&role=" + encodeURIComponent(role)} className="rounded-xl bg-violet-500 px-4 py-3 text-xs font-semibold hover:bg-violet-400"><BookOpen className="mr-2 inline h-4 w-4"/> Explore question bank</a><a href={"/features/interview-prep?company=" + encodeURIComponent(active.name) + "&role=" + encodeURIComponent(role)} className="rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 py-3 text-xs font-semibold text-violet-100 hover:bg-violet-400/15">Evidence-powered prep <ArrowRight className="ml-1 inline h-3 w-3"/></a><a href={"/features/interview-experiences?company=" + encodeURIComponent(active.name) + "&role=" + encodeURIComponent(role)} className="rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05]">Community experiences <ArrowRight className="ml-1 inline h-3 w-3"/></a><a href="/features/interview-lab" className="rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05]">Start interview practice <ArrowRight className="ml-1 inline h-3 w-3"/></a></div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-300"/><h3 className="font-semibold">Job description intelligence</h3></div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">Paste a role description. APEX detects terms from a limited built-in vocabulary in your browser and links them to relevant practice. A missing term is not proof you lack that skill.</p>
            <textarea value={job} onChange={e=>{setJob(e.target.value);setCopied(false);}} maxLength={20000} placeholder="Paste the job description here…" className="mt-4 min-h-36 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm leading-6 outline-none placeholder:text-zinc-600 focus:border-violet-400/50"/>
            <p className="mt-1 text-right text-[10px] text-zinc-600">{job.length.toLocaleString()} / 20,000</p>
            {detected.length>0 ? <div className="mt-4 flex flex-wrap gap-2">{detected.map(item=><a key={item.label} href={practiceLinks[item.label] ?? "/features/question-bank"} className="rounded-full border border-violet-300/20 bg-violet-300/[0.05] px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-300/10">{item.label} <ArrowRight className="ml-1 inline h-3 w-3"/></a>)}</div> : <p className="mt-3 text-xs text-zinc-600">Detected skills will appear here when matching terms are found.</p>}
            <label className="mt-5 block text-xs text-zinc-400">Private research notes<textarea value={researchNotes} onChange={e=>{setResearchNotes(e.target.value);setCopied(false);}} maxLength={5000} placeholder="Questions to ask, recruiter notes or details to verify…" className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm leading-6 outline-none placeholder:text-zinc-600 focus:border-violet-400/50"/></label>
            <button onClick={copyPlan} className="mt-4 rounded-xl border border-violet-300/20 bg-violet-400/10 px-4 py-3 text-xs font-semibold text-violet-100 hover:bg-violet-400/15"><Copy className="mr-2 inline h-4 w-4"/>{copied ? "Preparation plan copied" : "Copy preparation plan"}</button>
          </section>

          <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-5"><p className="text-xs font-semibold text-amber-200">Know what is verified</p><p className="mt-2 text-xs leading-5 text-zinc-500">Career links point to company-controlled websites. Official interview resources are available only for some companies; check each source's publication date and role applicability. Google’s linked article is explicitly historical (March 2022). Preparation blueprints are APEX-authored general study guidance, not claims about current interview rounds or question frequency. Job-description text and notes stay in this browser page and are not sent to an API or saved to your account.</p></div>
        </div>
      </div>
    </section>
  </main>;
}

"use client";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

import { useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, BrainCircuit, CheckCircle2, Code2, Copy, FileCode2, GitBranch, Layers3, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";

const categories = [
  { name: "Architecture", icon: Layers3, prompts: ["Walk through the main components and explain why you separated them this way.", "Trace one important request from the user interface to the data store.", "Which component owns the most important business rules, and why?"] },
  { name: "Trade-offs", icon: GitBranch, prompts: ["What is one design decision you would reconsider, and what would you choose instead?", "Which requirement did you prioritise when two requirements conflicted?", "What complexity did your chosen stack introduce?"] },
  { name: "Implementation", icon: Code2, prompts: ["Explain the most technically challenging part of your implementation.", "How do you validate inputs and handle unexpected states?", "Which part of the code would you refactor first as the project grows?"] },
  { name: "Debugging", icon: FileCode2, prompts: ["Describe a realistic failure in this project and how you would isolate its cause.", "What logs or metrics would help you diagnose a production issue?", "How would you reproduce and prevent a bug that only appears intermittently?"] },
  { name: "Security", icon: ShieldCheck, prompts: ["What data should be treated as sensitive, and how is it protected?", "Where should authorization checks happen, and how would you test them?", "What abuse cases or trust boundaries should this project account for?"] },
  { name: "Scaling & testing", icon: Sparkles, prompts: ["What is likely to become the first bottleneck as usage grows?", "Which tests provide the most confidence in the critical user journey?", "How would you evolve this project without disrupting existing users?"] },
];

const rubric = ["I explained the problem and users clearly", "I connected the architecture to real requirements", "I justified trade-offs instead of listing technologies", "I used a concrete implementation example", "I acknowledged limitations and future improvements"];

export default function ProjectDefense() {
  const [name,setName]=useState("");
  const [summary,setSummary]=useState("");
  const [stack,setStack]=useState("");
  const [architecture,setArchitecture]=useState("");
  const [code,setCode]=useState("");
  const [category,setCategory]=useState(0);
  const [question,setQuestion]=useState(0);
  const [answer,setAnswer]=useState("");
  const [checked,setChecked]=useState<string[]>([]);
  const [generated,setGenerated]=useState(false);
  const [copied,setCopied]=useState(false);

  const context=useMemo(()=>[name && "Project: "+name,summary && "Description: "+summary,stack && "Tech stack: "+stack,architecture && "Architecture: "+architecture,code && "Code excerpt supplied: yes"].filter(Boolean).join("\n"),[name,summary,stack,architecture,code]);
  const activeCategory=categories[category];
  const activeQuestion=activeCategory.prompts[question];
  const questionText=name.trim()?activeQuestion.replace("this project",name.trim()):activeQuestion;
  const makeBrief=()=>[context,"\nPractice question: "+questionText,"\nMy answer:\n"+answer].join("\n");
  const copyBrief=async()=>{try{await navigator.clipboard.writeText(makeBrief());setCopied(true);setTimeout(()=>setCopied(false),1600);}catch{setCopied(false);}};
  const reset=()=>{setCategory(0);setQuestion(0);setAnswer("");setChecked([]);setGenerated(false);};

  return <ApexWorkspaceShell><main className="min-h-screen text-[var(--text)]">
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8">
      <div className="mb-9"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#c5f36a]"><BookOpenCheck className="h-4 w-4"/> FEATURE EXPERIENCE / 07</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Project Defense</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Turn a project you have built into a clear technical story. Practise explaining architecture, implementation decisions, debugging and trade-offs.</p></div>
      <div className="mb-6 rounded-2xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.05] p-4 text-xs leading-5 text-[var(--muted)]"><BrainCircuit className="mr-2 inline h-4 w-4 text-[#c5f36a]"/> This preview creates a question practice set from the details you enter using fixed templates. It does not connect to GitHub, inspect repositories, run code or use an AI model. Your entries stay in this page and are not sent to an API.</div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-semibold tracking-wider text-[#c5f36a]">PROJECT CONTEXT</p><h2 className="mt-2 text-xl font-semibold">Give the project a story</h2></div><span className="rounded-lg border border-[var(--line)] px-2 py-1 text-[10px] text-[var(--muted)]">LOCAL PREVIEW</span></div>
          <label className="text-xs font-medium text-[var(--text)]" htmlFor="project-name">Project name</label><input id="project-name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. APEX — career intelligence platform" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] px-4 py-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[#c5f36a]/50"/>
          <label className="mt-5 block text-xs font-medium text-[var(--text)]" htmlFor="project-summary">What does it do?</label><textarea id="project-summary" value={summary} onChange={e=>setSummary(e.target.value)} placeholder="Describe the users, problem and main workflow..." className="mt-2 min-h-24 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] p-4 text-sm leading-6 outline-none placeholder:text-[var(--muted)] focus:border-[#c5f36a]/50"/>
          <label className="mt-5 block text-xs font-medium text-[var(--text)]" htmlFor="project-stack">Tech stack</label><input id="project-stack" value={stack} onChange={e=>setStack(e.target.value)} placeholder="Next.js, TypeScript, PostgreSQL..." className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] px-4 py-3 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[#c5f36a]/50"/>
          <label className="mt-5 block text-xs font-medium text-[var(--text)]" htmlFor="project-architecture">Architecture and key decisions</label><textarea id="project-architecture" value={architecture} onChange={e=>setArchitecture(e.target.value)} placeholder="Describe components, data flow, APIs and important trade-offs..." className="mt-2 min-h-28 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] p-4 text-sm leading-6 outline-none placeholder:text-[var(--muted)] focus:border-[#c5f36a]/50"/>
          <label className="mt-5 block text-xs font-medium text-[var(--text)]" htmlFor="project-code">Optional code excerpt</label><textarea id="project-code" value={code} onChange={e=>setCode(e.target.value)} placeholder="Paste a short excerpt you want to practise explaining..." className="mt-2 min-h-24 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] p-4 font-mono text-xs leading-5 outline-none placeholder:text-[var(--muted)] focus:border-[#c5f36a]/50"/>
          <button onClick={()=>{setGenerated(true);setCategory(0);setQuestion(0);setAnswer("");setChecked([]);}} disabled={!name.trim()&&!summary.trim()&&!stack.trim()&&!architecture.trim()&&!code.trim()} className="mt-5 w-full rounded-xl bg-[#c5f36a] px-5 py-3.5 text-sm font-semibold transition hover:bg-[#c5f36a] disabled:cursor-not-allowed disabled:opacity-40">Build my practice set <ArrowRight className="ml-2 inline h-4 w-4"/></button>
          <p className="mt-3 text-[10px] leading-5 text-[var(--muted)]">Do not paste passwords, API keys, private customer data or other secrets into the optional code field.</p>
        </section>
        <div className="space-y-5">
          <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold tracking-wider text-[#c5f36a]">DEFENCE WORKSPACE</p><h2 className="mt-2 text-xl font-semibold">Explain your decisions</h2></div><span className="text-[10px] text-[var(--muted)]">{generated?"Practice set ready":"Starter questions"}</span></div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">{categories.map((c,i)=><button key={c.name} onClick={()=>{setCategory(i);setQuestion(0);setAnswer("");setChecked([]);}} className={`flex items-center gap-2 rounded-xl border p-3 text-left text-xs transition ${category===i?"border-[#c5f36a]/30 bg-[#c5f36a]/[0.08] text-[#dff6ae]":"border-[var(--line)] bg-white/[0.02] text-[var(--muted)] hover:bg-white/[0.05]"}`}><c.icon className="h-3.5 w-3.5"/>{c.name}</button>)}</div>
            <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--app-bg)] p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold tracking-wider text-[var(--muted)]">{activeCategory.name.toUpperCase()} / QUESTION {question+1} OF {activeCategory.prompts.length}</span><span className="text-[10px] text-[#c5f36a]">Practice</span></div><h3 className="mt-4 text-lg font-medium leading-7">{questionText}</h3><div className="mt-5 flex justify-between"><button onClick={()=>{setQuestion(v=>(v+activeCategory.prompts.length-1)%activeCategory.prompts.length);setAnswer("");}} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)] hover:text-[var(--text)]">Previous</button><button onClick={()=>{setQuestion(v=>(v+1)%activeCategory.prompts.length);setAnswer("");}} className="rounded-lg bg-white/[0.08] px-3 py-2 text-xs text-[var(--text)] hover:bg-white/[0.12]">Next question <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></button></div></div>
            <label htmlFor="defense-answer" className="mt-5 block text-xs font-medium text-[var(--text)]">Your answer</label><textarea id="defense-answer" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Structure your answer: context → decision → reasoning → trade-off → result..." className="mt-2 min-h-36 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] p-4 text-sm leading-6 outline-none placeholder:text-[var(--muted)] focus:border-[#c5f36a]/50"/>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] text-[var(--muted)]">{answer.trim()?answer.trim().split(/\s+/).length:0} words · Self-review only</span><button onClick={copyBrief} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-[var(--text)] hover:bg-white/[0.05]"><Copy className="mr-1 inline h-3.5 w-3.5"/>{copied?"Copied":"Copy practice brief"}</button></div>
          </section>
          <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold tracking-wider text-[#c5f36a]">SELF-REVIEW RUBRIC</p><h3 className="mt-2 font-semibold">Did your explanation hold up?</h3></div><span className="text-xs text-[var(--muted)]">{checked.length}/{rubric.length}</span></div><div className="mt-4 space-y-3">{rubric.map(item=><label key={item} className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-[var(--muted)]"><input type="checkbox" checked={checked.includes(item)} onChange={e=>setChecked(v=>e.target.checked?[...v,item]:v.filter(x=>x!==item))} className="mt-0.5 accent-[#c5f36a]"/><span className={checked.includes(item)?"text-[var(--text)]":""}>{item}</span></label>)}</div><div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4"><span className="text-[10px] text-[var(--muted)]">Checklist completion, not an interview score</span><button onClick={reset} className="text-xs text-[var(--muted)] hover:text-[var(--text)]"><RotateCcw className="mr-1 inline h-3.5 w-3.5"/> Reset session</button></div></section>
          <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-4 text-xs leading-5 text-[var(--muted)]"><ShieldCheck className="mr-2 inline h-4 w-4 text-amber-200"/> Repository connection, code understanding, tailored AI follow-ups, saved sessions and automated answer feedback are future milestones — not active in this preview.</div>
        </div>
      </div>
    </section>
  </main></ApexWorkspaceShell>;
}

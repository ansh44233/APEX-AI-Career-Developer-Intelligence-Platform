"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Bot, BookOpen, Check, Code2, Copy, FileSearch, MessageSquareText, Network, ShieldCheck, Sparkles } from "lucide-react";

const skills = [
  { name: "Interview Prep", slug: "interview-prep", description: "Mock technical and behavioural interviews with structured, honest feedback.", icon: MessageSquareText, tasks: ["One-question-at-a-time mock interviews", "Technical and behavioural answer review", "Difficulty adapted to demonstrated comfort"] },
  { name: "Coding Practice", slug: "coding-practice", description: "Learn algorithms through hints, approach design, complexity analysis and debugging.", icon: Code2, tasks: ["Progressive hint mode", "Complexity and edge-case review", "Code feedback without claiming unrun tests"] },
  { name: "System Design", slug: "system-design", description: "Work from requirements to architecture, data flows, reliability and trade-offs.", icon: Network, tasks: ["Requirements and scale assumptions", "Architecture and API walkthroughs", "Reliability, security and trade-offs"] },
  { name: "Project Review", slug: "project-review", description: "Inspect a repository carefully and prepare to explain its real architecture and decisions.", icon: ShieldCheck, tasks: ["Evidence-based codebase review", "Prioritised findings with file references", "Read-only by default; no surprise commits"] },
  { name: "Resume Coach", slug: "resume-coach", description: "Improve truthful resume bullets and compare real experience with a target role.", icon: FileSearch, tasks: ["Role-relevant wording", "Evidence-based bullet improvements", "No fabricated metrics or ATS guarantees"] },
];
const installCommands = {
  codex: "mkdir -p .agents/skills && cp -R skills/* .agents/skills/",
  copilot: "mkdir -p .github/skills && cp -R skills/* .github/skills/",
  powershellCodex: "New-Item -ItemType Directory -Force .agents/skills; Get-ChildItem skills -Directory | Copy-Item -Destination .agents/skills -Recurse -Force",
  powershellCopilot: "New-Item -ItemType Directory -Force .github/skills; Get-ChildItem skills -Directory | Copy-Item -Destination .github/skills -Recurse -Force",
};

export default function ApexSkillsPage() {
  const [copied, setCopied] = useState("");
  const copy = async (key: keyof typeof installCommands) => {
    try { await navigator.clipboard.writeText(installCommands[key]); setCopied(key); }
    catch { setCopied(""); }
  };
  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> APEX home</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a>
    </header>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><Sparkles className="h-4 w-4"/> APEX ECOSYSTEM / SKILLS</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Useful workflows.<br/><span className="text-violet-300">Where you build.</span></h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Portable instruction packs that teach compatible AI coding agents how to coach, review and guide developer workflows. Browse each skill, inspect its instructions and copy the install command for your workspace.</p>
      </div>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[["5","Open skills"],["1","Shared format"],["0","Runtime dependencies"]].map(([value,label])=><div key={label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-zinc-500">{label}</p></div>)}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4"><div><p className="text-xs font-semibold text-emerald-200">PUBLIC SKILLS REGISTRY AVAILABLE</p><p className="mt-1 text-[11px] text-zinc-500">Clients can discover metadata and retrieve allowlisted skill instructions through the read-only API.</p></div><a href="/api/skills" target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-300/15 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300/[0.06]">Open registry API <ArrowRight className="ml-1 inline h-3 w-3"/></a></div>
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-violet-300/10 bg-violet-400/[0.04] p-5"><Bot className="mt-0.5 h-5 w-5 shrink-0 text-violet-300"/><div><p className="text-sm font-semibold">Built on the open Agent Skills format</p><p className="mt-1 text-xs leading-5 text-zinc-500">Each skill is a folder with a YAML-frontmatter SKILL.md. Compatible agents discover and load skills differently; support and installation paths vary by product and version. These files do not connect an agent to APEX APIs or add model capabilities by themselves.</p><a className="mt-2 inline-flex text-xs text-violet-300 hover:text-violet-200" href="https://agentskills.io/specification" target="_blank" rel="noreferrer">Read the format specification <ArrowRight className="ml-1 h-3 w-3"/></a></div></div>
      <div className="grid gap-4 md:grid-cols-2">
        {skills.map((skill,index)=><article key={skill.slug} className="rounded-3xl border border-white/10 bg-[#111119] p-6">
          <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border border-violet-300/10 bg-violet-400/[0.07] text-violet-200"><skill.icon className="h-5 w-5"/></span><div><p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-600">SKILL 0{index+1}</p><h2 className="mt-1 font-semibold">{skill.name}</h2></div></div><span className="rounded-full border border-emerald-300/10 px-2.5 py-1 text-[9px] text-emerald-200">Available</span></div>
          <p className="mt-5 text-sm leading-6 text-zinc-400">{skill.description}</p>
          <ul className="mt-4 space-y-2">{skill.tasks.map(task=><li key={task} className="flex gap-2 text-xs text-zinc-500"><Check className="h-3.5 w-3.5 shrink-0 text-violet-300"/>{task}</li>)}</ul>
          <a href={"https://github.com/ansh44233/APEX-AI-Career-Developer-Intelligence-Platform/blob/main/skills/"+skill.slug+"/SKILL.md"} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center text-xs font-semibold text-violet-300 hover:text-violet-200">Inspect SKILL.md <ArrowRight className="ml-1 h-3.5 w-3.5"/></a>
        </article>)}
      </div>
      <section className="mt-8 rounded-3xl border border-white/10 bg-[#111119] p-6 sm:p-7">
        <div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-violet-300"/><div><h2 className="font-semibold">Install in a project workspace</h2><p className="mt-1 text-xs text-zinc-500">Run from the root of a project after cloning or downloading APEX.</p></div></div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div><p className="text-xs font-semibold">Codex-style workspace</p><p className="mt-1 text-[11px] text-zinc-500">Copies skills into .agents/skills.</p><pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/30 p-3 text-[11px] leading-5 text-zinc-300">{installCommands.codex}</pre><button onClick={()=>copy("codex")} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"><Copy className="mr-2 inline h-3.5 w-3.5"/>{copied==="codex"?"Copied":"Copy command"}</button></div>
          <div><p className="text-xs font-semibold">GitHub Copilot-style workspace</p><p className="mt-1 text-[11px] text-zinc-500">Copies skills into .github/skills.</p><pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/30 p-3 text-[11px] leading-5 text-zinc-300">{installCommands.copilot}</pre><button onClick={()=>copy("copilot")} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"><Copy className="mr-2 inline h-3.5 w-3.5"/>{copied==="copilot"?"Copied":"Copy command"}</button></div>
          <div><p className="text-xs font-semibold">Windows PowerShell · Codex-style</p><pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/30 p-3 text-[11px] leading-5 text-zinc-300">{installCommands.powershellCodex}</pre><button onClick={()=>copy("powershellCodex")} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"><Copy className="mr-2 inline h-3.5 w-3.5"/>{copied==="powershellCodex"?"Copied":"Copy command"}</button></div>
          <div><p className="text-xs font-semibold">Windows PowerShell · Copilot-style</p><pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/30 p-3 text-[11px] leading-5 text-zinc-300">{installCommands.powershellCopilot}</pre><button onClick={()=>copy("powershellCopilot")} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"><Copy className="mr-2 inline h-3.5 w-3.5"/>{copied==="powershellCopilot"?"Copied":"Copy command"}</button></div>
        </div>
        <p className="mt-5 text-xs leading-5 text-zinc-500">Use only the directory documented by your specific agent. If it does not support Agent Skills, placing files in a folder will not activate them. Review each skill before enabling it in a workspace.</p>
      </section>
      <div className="mt-6 rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-5"><p className="flex items-center gap-2 text-xs font-semibold text-amber-200"><ShieldCheck className="h-4 w-4"/> TRANSPARENT BY DESIGN</p><p className="mt-2 text-xs leading-5 text-zinc-500">These are instruction packs, not autonomous agents, code execution environments, security scanners or integrations. Project Review is read-only by default. The skills do not send repository or resume content to APEX servers.</p></div>
    </section>
  </main>;
}

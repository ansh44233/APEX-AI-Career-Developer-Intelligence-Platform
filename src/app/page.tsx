"use client";

import {
  ArrowRight, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Check,
  Code2, FileSearch, Gauge, Layers3, Menu, MessageSquareText, Mic2,
  ShieldCheck, Sparkles, Target, Trophy, X, Zap,
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: MessageSquareText, number: "01", title: "AI Interview Lab", href: "/features/interview-lab", text: "Practise technical, behavioural and HR interviews with structured feedback and adaptive follow-up questions.", status: "Planned" },
  { icon: Code2, number: "02", title: "OA Arena", href: "/features/oa-arena", text: "A focused environment for timed coding assessments, problem-solving practice and evaluation.", status: "Planned" },
  { icon: BriefcaseBusiness, number: "03", title: "Company Intelligence", href: "/features/company-intelligence", text: "Organise company research, role expectations and preparation notes in one place.", status: "Planned" },
  { icon: FileSearch, number: "04", title: "Resume Intelligence", href: "/features/resume-intelligence", text: "Review resume clarity, identify gaps and compare experience against a target role.", status: "Planned" },
  { icon: Layers3, number: "05", title: "System Design Studio", href: "/features/system-design", text: "Work through architecture prompts, trade-offs and design explanations step by step.", status: "Planned" },
  { icon: Gauge, number: "06", title: "Readiness Engine", href: "/features/readiness-engine", text: "Turn practice signals into a transparent view of strengths, gaps and next priorities.", status: "Planned" },
  { icon: ShieldCheck, number: "07", title: "Project Defense", href: "/features/project-defense", text: "Turn your project architecture, code decisions and trade-offs into a confident technical story.", status: "Preview" },
];

const steps = [
  ["01", "Set your direction", "Choose a target role and define what you want to improve."],
  ["02", "Practise with purpose", "Use focused workflows for interviews, coding and career preparation."],
  ["03", "Learn from every session", "Review feedback, spot recurring gaps and decide what to work on next."],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="min-h-screen overflow-hidden bg-[#09090d] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(124,58,237,0.22),transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-lg font-black shadow-lg shadow-violet-950/50">A</span><span className="text-lg font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span></a>
        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a className="transition hover:text-white" href="#platform">Platform</a><a className="transition hover:text-white" href="#how-it-works">How it works</a><a className="transition hover:text-white" href="#roadmap">Roadmap</a>
        </nav>
        <div className="hidden items-center gap-3 md:flex"><a href="https://github.com/ansh44233/APEX-AI-Career-Developer-Intelligence-Platform" target="_blank" rel="noreferrer" className="px-3 py-2 text-sm text-zinc-400 transition hover:text-white">GitHub <ArrowUpRight className="ml-1 inline h-4 w-4" /></a><a href="/sign-in" className="px-3 py-2 text-sm text-zinc-300 transition hover:text-white">Sign in</a><a href="/sign-up" className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400">Create account</a><a href="/dashboard" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-violet-100">Open preview <ArrowRight className="ml-1 inline h-4 w-4" /></a></div>
        <button aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg border border-white/10 p-2 md:hidden">{menuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
      </header>
      {menuOpen && <nav className="relative z-20 mx-5 grid gap-3 rounded-2xl border border-white/10 bg-[#12121a] p-4 text-sm text-zinc-300 md:hidden"><a onClick={() => setMenuOpen(false)} href="#platform">Platform</a><a onClick={() => setMenuOpen(false)} href="#how-it-works">How it works</a><a onClick={() => setMenuOpen(false)} href="#roadmap">Roadmap</a><a href="/sign-in">Sign in</a><a href="/sign-up">Create account →</a><a href="/dashboard">Open preview →</a></nav>}

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:pb-32 lg:pt-28">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/[0.08] px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-violet-200"><Sparkles className="h-3.5 w-3.5"/> THE CAREER & DEVELOPER INTELLIGENCE PLATFORM</div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[4.4rem]">Turn preparation into your <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-300 bg-clip-text text-transparent">next advantage.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">A focused workspace for interview practice, coding assessments and career growth. Build skills with intention, understand your gaps and move forward with a plan.</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="/dashboard" className="rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-semibold shadow-xl shadow-violet-950/40 transition hover:bg-violet-400">Explore the dashboard <ArrowRight className="ml-2 inline h-4 w-4"/></a><a href="#platform" className="rounded-xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.05]">Explore the platform</a></div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-zinc-500"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-300"/> One connected workspace</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-300"/> Progress-led preparation</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-300"/> Built for developers</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-8 rounded-[2rem] bg-violet-500/10 blur-3xl"/>
          <div className="relative rounded-3xl border border-white/10 bg-[#111119]/95 p-4 shadow-2xl shadow-black/50 sm:p-5">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-4"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-400"/><span className="text-xs font-semibold tracking-[0.16em]">APEX / OVERVIEW</span></div><span className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-zinc-500">PRODUCT PREVIEW</span></div>
            <div className="py-6"><p className="text-xs text-zinc-500">YOUR NEXT STEP</p><h3 className="mt-2 text-2xl font-semibold tracking-tight">Make progress measurable.</h3><p className="mt-2 text-xs leading-5 text-zinc-500">A snapshot of the workspace experience. Figures below are illustrative sample data.</p></div>
            <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"><Target className="mb-4 h-4 w-4 text-violet-300"/><p className="text-2xl font-semibold">68%</p><p className="mt-1 text-[11px] text-zinc-500">Preparation progress</p></div><div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"><Trophy className="mb-4 h-4 w-4 text-fuchsia-300"/><p className="text-2xl font-semibold">81<span className="text-sm text-zinc-500">/100</span></p><p className="mt-1 text-[11px] text-zinc-500">Practice score</p></div></div>
            <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold">Preparation toolkit</span><span className="text-[10px] text-violet-300">6 focus areas</span></div>{[["Interview practice",82],["Problem solving",68],["System design",48]].map(([label,value])=><div className="mb-3 last:mb-0" key={label as string}><div className="mb-2 flex justify-between text-[10px] text-zinc-400"><span>{label}</span><span>{value}%</span></div><div className="h-1.5 rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-300" style={{width:value+"%"}}/></div></div>)}</div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-violet-300/15 bg-violet-400/[0.06] p-4"><BrainCircuit className="h-8 w-8 text-violet-300"/><div><p className="text-xs font-semibold">APEX Intelligence</p><p className="mt-1 text-[10px] text-zinc-500">Personalised guidance · planned capability</p></div><ArrowUpRight className="ml-auto h-4 w-4 text-zinc-500"/></div>
          </div>
        </div>
      </section>

      <section id="platform" className="relative z-10 border-y border-white/[0.06] bg-white/[0.015] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-semibold tracking-[0.2em] text-violet-300">THE APEX TOOLKIT</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Everything should connect to a clear next step.</h2><p className="mt-4 text-sm leading-6 text-zinc-400">A modular platform designed around the full preparation journey — not disconnected tools and random practice.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{features.map((feature)=><a href={feature.href || "#"} key={feature.number} className="group block rounded-2xl border border-white/[0.07] bg-[#101017] p-6 transition hover:-translate-y-1 hover:border-violet-300/25"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl border border-violet-300/10 bg-violet-400/[0.07] text-violet-200"><feature.icon className="h-5 w-5"/></span><span className="text-[10px] tracking-[0.16em] text-zinc-600">{feature.number}</span></div><div className="mt-7 flex items-center gap-2"><h3 className="text-base font-semibold">{feature.title}</h3><span className="rounded-full border border-amber-300/15 bg-amber-300/[0.05] px-2 py-0.5 text-[9px] text-amber-200/80">{feature.status}</span></div><p className="mt-3 text-sm leading-6 text-zinc-500">{feature.text}</p><span className="mt-5 inline-flex items-center text-xs font-semibold text-violet-300">Explore experience <ArrowUpRight className="ml-1 h-3.5 w-3.5"/></span></a>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-semibold tracking-[0.2em] text-violet-300">A SIMPLE LOOP</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Practice. Understand. Improve.</h2><p className="mt-4 text-sm leading-6 text-zinc-400">APEX is being shaped around a repeatable improvement cycle that makes preparation easier to organise and evaluate.</p></div><div className="space-y-3">{steps.map(([number,title,description])=><div key={number} className="flex gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"><span className="pt-1 text-xs font-semibold text-violet-300">{number}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p></div></div>)}</div></div></section>

      <section id="roadmap" className="relative z-10 border-y border-white/[0.06] bg-white/[0.015] px-5 py-20 sm:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center"><div><p className="text-xs font-semibold tracking-[0.2em] text-violet-300">BUILT IN THE OPEN</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">An ambitious platform, developed transparently.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">APEX now connects company research, role-based question practice, interview preparation, application tracking and career planning in one platform. Accounts and persistent career data are implemented; AI-assisted workflows remain limited until an AI provider is configured. Explore the working modules and follow the product as it evolves.</p><a className="mt-7 inline-flex items-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.05]" href="https://github.com/ansh44233/APEX-AI-Career-Developer-Intelligence-Platform" target="_blank" rel="noreferrer">Follow APEX on GitHub <ArrowUpRight className="ml-2 h-4 w-4"/></a></div><div className="rounded-3xl border border-white/[0.08] bg-[#111119] p-6"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-violet-300"/><p className="font-semibold">Current foundation</p></div><ul className="mt-6 space-y-4 text-sm text-zinc-400"><li className="flex gap-3"><Check className="h-4 w-4 shrink-0 text-emerald-400"/> Next.js, React, TypeScript and responsive product UI</li><li className="flex gap-3"><Check className="h-4 w-4 shrink-0 text-emerald-400"/> Authentication, PostgreSQL data model and owner-scoped APIs</li><li className="flex gap-3"><Check className="h-4 w-4 shrink-0 text-emerald-400"/> Company-to-role preparation, practice and application workflows</li><li className="flex gap-3"><Zap className="h-4 w-4 shrink-0 text-amber-300"/> AI provider integration, live integrations and production deployment — not configured</li></ul><a href="/dashboard" className="mt-7 flex items-center justify-center rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold transition hover:bg-violet-400">Open dashboard preview <ArrowRight className="ml-2 h-4 w-4"/></a></div></div></section>
      <footer className="relative z-10 mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-8 text-xs text-zinc-600 sm:flex-row sm:px-8"><span>© 2026 APEX · AI Career & Developer Intelligence</span><span>Early product foundation · Sample data only</span></footer>
    </main>
  );
}

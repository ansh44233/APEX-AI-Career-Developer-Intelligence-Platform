"use client";

import {
  ArrowRight, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Check,
  Code2, FileSearch, Gauge, Layers3, Menu, MessageSquareText, ShieldCheck,
  Sparkles, Target, X, Zap,
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: MessageSquareText, number: "01", title: "Interview practice", href: "/features/mock-interview", text: "Structured technical, behavioural and system-design rounds. Save every answer and build a repeatable practice habit.", status: "Available" },
  { icon: Code2, number: "02", title: "Question library", href: "/features/question-bank", text: "Explore role-based prompts, hints and answer rubrics. Generate fresh practice questions when AI is configured.", status: "Available" },
  { icon: BriefcaseBusiness, number: "03", title: "Company intelligence", href: "/features/company-intelligence", text: "Research supported companies with source-linked claims, role context and preparation blueprints.", status: "Available" },
  { icon: FileSearch, number: "04", title: "Resume intelligence", href: "/features/resume-intelligence", text: "Compare resume content with a target role and identify concrete areas to improve.", status: "Available" },
  { icon: Layers3, number: "05", title: "System design studio", href: "/features/system-design", text: "Work through architecture prompts, trade-offs and clear design explanations.", status: "Available" },
  { icon: Gauge, number: "06", title: "Readiness engine", href: "/features/readiness-engine", text: "Turn saved practice and self-assessments into transparent preparation priorities.", status: "Available" },
  { icon: ShieldCheck, number: "07", title: "Project defense", href: "/features/project-defense", text: "Explain your project architecture, technical decisions and trade-offs with confidence.", status: "Preview" },
];

const steps = [
  ["01", "Choose a direction", "Set a target role, company and the skills you want to strengthen."],
  ["02", "Train deliberately", "Practise with question tracks, mock interviews and focused coding sessions."],
  ["03", "Turn sessions into progress", "Save your work, review weak spots and decide what to practise next."],
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="min-h-screen overflow-hidden bg-[#080a08] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(ellipse_at_78%_-12%,rgba(198,255,61,0.12),transparent_34rem)]" />
      <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c6ff3d] text-lg font-black text-[#0b0d08] shadow-lg shadow-lime-950/30">A</span><span className="text-lg font-extrabold tracking-[0.18em]">APEX<span className="text-[#c6ff3d]">.</span></span></a>
        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex"><a className="transition hover:text-white" href="#platform">Platform</a><a className="transition hover:text-white" href="#how-it-works">How it works</a><a className="transition hover:text-white" href="#principles">Principles</a></nav>
        <div className="hidden items-center gap-3 md:flex"><a href="https://github.com/ansh44233/APEX-AI-Career-Developer-Intelligence-Platform" target="_blank" rel="noreferrer" className="px-3 py-2 text-sm text-zinc-400 transition hover:text-white">GitHub <ArrowUpRight className="ml-1 inline h-4 w-4"/></a><a href="/sign-in" className="px-3 py-2 text-sm text-zinc-300 transition hover:text-white">Sign in</a><a href="/sign-up" className="rounded-xl bg-[#c6ff3d] px-4 py-2.5 text-sm font-bold text-[#0b0d08] transition hover:bg-[#d6ff75]">Create account</a></div>
        <button aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg border border-white/10 p-2 md:hidden">{menuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}</button>
      </header>
      {menuOpen && <nav className="relative z-20 mx-5 grid gap-3 rounded-2xl border border-white/10 bg-[#11150e] p-4 text-sm text-zinc-300 md:hidden"><a onClick={() => setMenuOpen(false)} href="#platform">Platform</a><a onClick={() => setMenuOpen(false)} href="#how-it-works">How it works</a><a onClick={() => setMenuOpen(false)} href="#principles">Principles</a><a href="/sign-in">Sign in</a><a href="/sign-up">Create account →</a></nav>}

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-32 lg:pt-28">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#c6ff3d]/20 bg-[#c6ff3d]/[0.07] px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-[#d8ff83]"><Sparkles className="h-3.5 w-3.5"/> CAREER INTELLIGENCE FOR BUILDERS</div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-[4.7rem]">Get better at the work that gets you <span className="text-[#c6ff3d]">hired.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">One focused workspace for interview preparation, coding practice, company research and career decisions. Less random grinding. More deliberate progress.</p>
          <div className="mt-9 flex flex-wrap gap-3"><a href="/dashboard" className="rounded-xl bg-[#c6ff3d] px-5 py-3.5 text-sm font-bold text-[#0b0d08] shadow-xl shadow-lime-950/30 transition hover:bg-[#d6ff75]">Open your workspace <ArrowRight className="ml-2 inline h-4 w-4"/></a><a href="#platform" className="rounded-xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.05]">Explore the platform</a></div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-zinc-500"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#c6ff3d]"/> Role-aware preparation</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#c6ff3d]"/> Saved practice history</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#c6ff3d]"/> Evidence-linked company research</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-8 rounded-[2rem] bg-[#c6ff3d]/[0.08] blur-3xl"/>
          <div className="relative rounded-3xl border border-white/10 bg-[#10130e]/95 p-4 shadow-2xl shadow-black/60 sm:p-5">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-4"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#c6ff3d]"/><span className="text-xs font-semibold tracking-[0.16em]">APEX / WORKSPACE</span></div><span className="rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-zinc-500">LIVE PREVIEW</span></div>
            <div className="py-6"><p className="text-xs text-zinc-500">YOUR PRACTICE LOOP</p><h3 className="mt-2 text-2xl font-semibold tracking-tight">One session at a time.</h3><p className="mt-2 text-xs leading-5 text-zinc-500">Choose a track, work through a prompt, save your answer and return to your progress.</p></div>
            <div className="grid grid-cols-2 gap-3"><a href="/features/question-bank" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:border-[#c6ff3d]/30"><BookOpenIcon/><p className="mt-4 text-sm font-semibold">Question bank</p><p className="mt-1 text-[11px] text-zinc-500">Topic tracks · Hints · Rubrics</p></a><a href="/features/mock-interview" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 transition hover:border-[#c6ff3d]/30"><BrainCircuit className="h-5 w-5 text-[#c6ff3d]"/><p className="mt-4 text-sm font-semibold">Mock interview</p><p className="mt-1 text-[11px] text-zinc-500">Rounds · Timers · Saved answers</p></a></div>
            <div className="mt-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold">Preparation workspace</span><span className="text-[10px] text-[#c6ff3d]">CONNECTED MODULES</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["RESEARCH","Company Intel"],["PRACTISE","Interview Lab"],["IMPROVE","Readiness"]].map(([tag,label])=><div key={tag} className="rounded-xl bg-white/[0.035] px-2 py-3"><p className="text-[9px] font-semibold tracking-wider text-[#c6ff3d]">{tag}</p><p className="mt-1 text-[10px] text-zinc-400">{label}</p></div>)}</div></div>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#c6ff3d]/15 bg-[#c6ff3d]/[0.05] p-4"><Zap className="h-6 w-6 text-[#c6ff3d]"/><div><p className="text-xs font-semibold">Built around your next action</p><p className="mt-1 text-[10px] text-zinc-500">Practice → Review → Improve</p></div><ArrowUpRight className="ml-auto h-4 w-4 text-zinc-500"/></div>
          </div>
        </div>
      </section>

      <section id="platform" className="relative z-10 border-y border-white/[0.06] bg-white/[0.015] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-xs font-semibold tracking-[0.2em] text-[#c6ff3d]">THE APEX TOOLKIT</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Everything you need to prepare with intent.</h2><p className="mt-4 text-sm leading-6 text-zinc-400">A connected set of tools for the full journey — from understanding a role to practising the skills and tracking what changes.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{features.map((feature)=><a href={feature.href} key={feature.number} className="group block rounded-2xl border border-white/[0.07] bg-[#10130e] p-6 transition hover:-translate-y-1 hover:border-[#c6ff3d]/25"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl border border-[#c6ff3d]/10 bg-[#c6ff3d]/[0.06] text-[#d8ff83]"><feature.icon className="h-5 w-5"/></span><span className="text-[10px] tracking-[0.16em] text-zinc-600">{feature.number}</span></div><div className="mt-7 flex items-center gap-2"><h3 className="text-base font-semibold">{feature.title}</h3><span className="rounded-full border border-[#c6ff3d]/15 bg-[#c6ff3d]/[0.05] px-2 py-0.5 text-[9px] text-[#d8ff83]">{feature.status}</span></div><p className="mt-3 text-sm leading-6 text-zinc-500">{feature.text}</p><span className="mt-5 inline-flex items-center text-xs font-semibold text-[#c6ff3d]">Open module <ArrowUpRight className="ml-1 h-3.5 w-3.5"/></span></a>)}</div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-semibold tracking-[0.2em] text-[#c6ff3d]">THE LOOP</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Practice. Understand. Improve.</h2><p className="mt-4 text-sm leading-6 text-zinc-400">Every tool should lead to a useful next step, not another disconnected checklist.</p></div><div className="space-y-3">{steps.map(([number,title,description])=><div key={number} className="flex gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"><span className="pt-1 text-xs font-semibold text-[#c6ff3d]">{number}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p></div></div>)}</div></div></section>

      <section id="principles" className="relative z-10 border-y border-white/[0.06] bg-white/[0.015] px-5 py-20 sm:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center"><div><p className="text-xs font-semibold tracking-[0.2em] text-[#c6ff3d]">BUILT WITH INTENT</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Useful, honest, and built to grow.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">APEX separates sourced company evidence from original practice material. Your saved sessions stay tied to your account. AI-assisted generation becomes available when a provider is configured — no fake AI scores or invented employer questions.</p><a className="mt-7 inline-flex items-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.05]" href="https://github.com/ansh44233/APEX-AI-Career-Developer-Intelligence-Platform" target="_blank" rel="noreferrer">Explore the build <ArrowUpRight className="ml-2 h-4 w-4"/></a></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/[0.07] bg-[#10130e] p-5"><Target className="h-5 w-5 text-[#c6ff3d]"/><h3 className="mt-4 text-sm font-semibold">Progress you can explain</h3><p className="mt-2 text-xs leading-5 text-zinc-500">Saved work and transparent signals, not made-up performance numbers.</p></div><div className="rounded-2xl border border-white/[0.07] bg-[#10130e] p-5"><ShieldCheck className="h-5 w-5 text-[#c6ff3d]"/><h3 className="mt-4 text-sm font-semibold">Evidence with context</h3><p className="mt-2 text-xs leading-5 text-zinc-500">Company claims stay linked to sources and their limits.</p></div></div></div></section>
      <footer className="relative z-10 mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8"><span className="font-bold tracking-[0.18em] text-zinc-300">APEX<span className="text-[#c6ff3d]">.</span></span><span>Career intelligence for developers · Built in the open</span><a href="/dashboard" className="text-[#c6ff3d] hover:text-white">Open workspace →</a></footer>
    </main>
  );
}

function BookOpenIcon() {
  return <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#c6ff3d]/10 text-[#c6ff3d]"><Code2 className="h-5 w-5"/></span>;
}

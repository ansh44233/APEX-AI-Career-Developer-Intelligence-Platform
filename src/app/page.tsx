"use client";

import { useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, AudioLines, Blocks, BookOpen,
  BrainCircuit, BriefcaseBusiness, Check, ChevronDown, CirclePlay, Code2,
  Command, FileText, Github, Layers3, Menu, MessageSquareText, Moon,
  Network, Radar, ShieldCheck, Sparkles, Target, Terminal, Trophy, X, Zap,
} from "lucide-react";

const capabilities = [
  { n: "01", icon: BrainCircuit, title: "AI Workspace", desc: "One context-aware space to learn, reason, write, debug and work through files with an AI mentor.", tags: ["Chat + files", "Code help", "Voice-ready"] },
  { n: "02", icon: Code2, title: "Engineering Lab", desc: "A focused coding arena with real problems, a proper editor, test cases and transparent evaluation.", tags: ["DSA", "SQL", "Multi-language"] },
  { n: "03", icon: AudioLines, title: "Interview Universe", desc: "Practise technical, HR, system design and project-defence rounds with adaptive follow-ups.", tags: ["Mock rounds", "OA simulator", "Feedback"] },
  { n: "04", icon: BriefcaseBusiness, title: "Career Intelligence", desc: "Research companies and roles, compare job descriptions, organise applications and plan your next move.", tags: ["Company research", "JD match", "Job tracker"] },
  { n: "05", icon: FileText, title: "Resume + GitHub", desc: "Turn real projects and experience into clear evidence. Improve the work, not just the wording.", tags: ["Resume review", "GitHub glow-up", "Project quality"] },
  { n: "06", icon: Radar, title: "Career Command", desc: "Bring learning, practice, project evidence and goals into one connected view of your progress.", tags: ["Skill map", "Prep plan", "Next actions"] },
];

const nav = [{ label: "Platform", href: "#platform" }, { label: "How it works", href: "#method" }, { label: "Engineering Lab", href: "#engineering" }];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="apex-site min-h-screen overflow-hidden bg-[#080b10] text-[#f4f5f1] selection:bg-[#c5f36a] selection:text-[#10150b]">
      <div className="apex-grain pointer-events-none fixed inset-0 z-0 opacity-[.13]" />
      <header className="relative z-30 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="/" className="group flex items-center gap-3" aria-label="APEX home">
          <span className="relative grid h-10 w-10 place-items-center rounded-[13px] border border-[#c5f36a]/30 bg-[#c5f36a] text-[#10150b] shadow-[0_0_34px_rgba(197,243,106,.15)]">
            <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" aria-hidden="true"><path d="M5 25 14 6.5c.8-1.7 2.2-1.7 3 0L27 25h-6.1l-5.3-11.2L10.4 25H5Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round"/><path d="m10 21 12-6" stroke="#536d24" strokeWidth="2.1" strokeLinecap="round"/></svg>
          </span>
          <span className="text-[19px] font-black tracking-[-.075em]">APEX<span className="text-[#c5f36a]">.</span><span className="ml-2 hidden text-[9px] font-semibold tracking-[.2em] text-white/35 sm:inline">CAREER INTELLIGENCE</span></span>
        </a>
        <nav className="hidden items-center gap-9 md:flex">{nav.map(item => <a key={item.href} href={item.href} className="text-[12px] font-medium text-white/55 transition hover:text-white">{item.label}</a>)}</nav>
        <div className="hidden items-center gap-3 md:flex">
          <a href="https://github.com/ansh44233/APEX-AI-Career-Developer-Intelligence-Platform" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 text-[11px] text-white/55 transition hover:text-white"><Github className="h-4 w-4"/> GitHub</a>
          <a href="/sign-in" className="rounded-full px-4 py-2.5 text-[11px] font-semibold text-white/75 transition hover:bg-white/[.06] hover:text-white">Sign in</a>
          <a href="/sign-up" className="group inline-flex items-center gap-2 rounded-full bg-[#c5f36a] px-5 py-3 text-[11px] font-bold text-[#11170a] transition hover:bg-[#d5ff80]">Get started <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></a>
        </div>
        <button onClick={() => setMenuOpen(v => !v)} aria-label="Toggle navigation" className="rounded-full border border-white/10 p-2.5 text-white md:hidden">{menuOpen ? <X className="h-4 w-4"/> : <Menu className="h-4 w-4"/>}</button>
      </header>
      {menuOpen && <nav className="relative z-40 mx-4 grid gap-1 rounded-2xl border border-white/10 bg-[#111720] p-3 md:hidden">{nav.map(item=><a key={item.href} onClick={()=>setMenuOpen(false)} href={item.href} className="rounded-xl px-4 py-3 text-sm text-white/75 hover:bg-white/5">{item.label}</a>)}<a href="/sign-in" className="rounded-xl px-4 py-3 text-sm text-white/75">Sign in</a><a href="/sign-up" className="rounded-xl bg-[#c5f36a] px-4 py-3 text-sm font-bold text-[#10150b]">Get started <ArrowRight className="ml-2 inline h-4 w-4"/></a></nav>}

      <section className="relative z-10 mx-auto grid max-w-[1440px] items-center gap-16 px-5 pb-24 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[.9fr_1.1fr] lg:px-12 lg:pb-32 lg:pt-24">
        <div className="relative">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#c5f36a]/20 bg-[#c5f36a]/[.07] px-3.5 py-2 text-[9px] font-bold tracking-[.18em] text-[#c5f36a]"><span className="h-1.5 w-1.5 rounded-full bg-[#c5f36a] shadow-[0_0_12px_#c5f36a]"/> YOUR CAREER, ENGINEERED</div>
          <h1 className="max-w-[700px] text-[clamp(3.4rem,7.4vw,7.3rem)] font-semibold leading-[.91] tracking-[-.085em]">Don't just get ready.<br/><span className="apex-gradient-text">Become undeniable.</span></h1>
          <p className="mt-8 max-w-[520px] text-[15px] leading-7 text-[#a2a9b2] sm:text-[17px] sm:leading-8">The connected workspace for developers who want to learn deeply, build proof, practise under pressure and make their next career move with clarity.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="/sign-up" className="group inline-flex items-center gap-3 rounded-full bg-[#c5f36a] px-6 py-4 text-[12px] font-bold text-[#10150b] shadow-[0_8px_40px_rgba(197,243,106,.12)] transition hover:-translate-y-0.5 hover:bg-[#d5ff80]">Enter APEX <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></a>
            <a href="#platform" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-4 text-[12px] font-semibold text-white/75 transition hover:border-white/30 hover:bg-white/[.04]"><CirclePlay className="h-4 w-4"/> Explore the system</a>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-[10px] font-medium tracking-[.04em] text-white/40"><span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c5f36a]"/> One connected workspace</span><span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#c5f36a]"/> Evidence over empty scores</span></div>
        </div>

        <div className="relative mx-auto w-full max-w-[760px]" id="engineering">
          <div className="apex-orbit absolute -inset-12 rounded-full opacity-70 blur-3xl"/>
          <div className="relative overflow-hidden rounded-[24px] border border-white/[.13] bg-[#101720] shadow-[0_35px_120px_rgba(0,0,0,.55)]">
            <div className="flex h-12 items-center justify-between border-b border-white/[.08] bg-[#141d27] px-4 sm:px-5">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#c5f36a]"/><span className="text-[9px] font-bold tracking-[.18em] text-white/65">APEX / ENGINEERING LAB</span></div>
              <div className="flex items-center gap-3 text-[9px] text-white/35"><span className="hidden sm:inline">WORKSPACE PREVIEW</span><span className="rounded-md border border-white/10 px-2 py-1">CONCEPT UI</span></div>
            </div>
            <div className="grid min-h-[390px] md:grid-cols-[.83fr_1.17fr]">
              <div className="border-b border-white/[.08] p-5 md:border-b-0 md:border-r md:border-white/[.08] sm:p-6">
                <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.16em] text-[#c5f36a]">DAILY CHALLENGE</span><span className="rounded-full bg-[#c5f36a]/10 px-2.5 py-1 text-[9px] text-[#c5f36a]">MEDIUM</span></div>
                <h3 className="mt-5 text-[23px] font-semibold tracking-[-.05em] text-white">Valid Parentheses</h3>
                <p className="mt-2 text-[11px] leading-5 text-white/45">Determine whether every opening bracket is closed in the correct order.</p>
                <div className="mt-6 space-y-4 text-[10px] leading-5 text-white/55">
                  <div><p className="mb-1 font-bold text-white/80">Example 01</p><code className="block rounded-lg border border-white/[.07] bg-black/20 px-3 py-2 font-mono text-[#c5f36a]">input: s = "()[]{}"<br/>output: true</code></div>
                  <div><p className="mb-1 font-bold text-white/80">Example 02</p><code className="block rounded-lg border border-white/[.07] bg-black/20 px-3 py-2 font-mono text-[#c5f36a]">input: s = "(]"<br/>output: false</code></div>
                  <div className="border-t border-white/[.08] pt-3"><p className="font-bold text-white/80">Your task</p><p className="mt-1">Choose a language, write your solution and test edge cases before submitting.</p></div>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[9px] text-white/35"><BookOpen className="h-3.5 w-3.5"/> DSA · Stack · Arrays</div>
              </div>
              <div className="flex min-h-[390px] flex-col bg-[#0c1219]">
                <div className="flex items-center justify-between border-b border-white/[.07] px-4 py-3"><div className="flex items-center gap-2 text-[10px] text-white/65"><Terminal className="h-3.5 w-3.5 text-[#c5f36a]"/> solution.js <ChevronDown className="h-3 w-3 text-white/30"/></div><span className="text-[9px] text-white/30">JavaScript</span></div>
                <div className="flex flex-1 gap-4 overflow-hidden p-4 font-mono text-[10px] leading-[2.05] sm:p-5 sm:text-[11px]">
                  <div className="select-none text-right text-white/20">1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7<br/>8<br/>9<br/>10</div>
                  <div className="min-w-0 text-[#d4dbe2]"><span className="text-[#c792ea]">function</span> <span className="text-[#82aaff]">isValid</span>(s) {"{"}<br/><span className="pl-4 text-[#c792ea]">const</span> stack = [];<br/><span className="pl-4 text-[#c792ea]">const</span> pairs = {"{"} <span className="text-[#c3e88d]">")"</span>:<span className="text-[#c3e88d]">"("</span> {"}"};<br/><br/><span className="pl-4 text-[#c792ea]">for</span> (<span className="text-[#c792ea]">const</span> char <span className="text-[#c792ea]">of</span> s) {"{"}<br/><span className="pl-8 text-[#c792ea]">if</span> (pairs[char]) {"{"}<br/><span className="pl-12">{"//"} check the latest opener</span><br/><span className="pl-8">{"}"}</span><br/><span className="pl-4">{"}"}</span><br/><span className="pl-4 text-[#c792ea]">return</span> stack.length === 0;<br/>{"}"}</div>
                </div>
                <div className="mt-auto border-t border-white/[.07] p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.14em] text-white/45">TEST RESULTS</span><span className="text-[9px] text-white/30">Illustrative preview</span></div>
                  <div className="grid grid-cols-3 gap-2"><div className="rounded-lg border border-white/[.07] bg-white/[.025] p-2.5"><p className="text-[15px] font-semibold text-white">—</p><p className="mt-1 text-[8px] text-white/35">Passed</p></div><div className="rounded-lg border border-white/[.07] bg-white/[.025] p-2.5"><p className="text-[15px] font-semibold text-white">—</p><p className="mt-1 text-[8px] text-white/35">Runtime</p></div><div className="rounded-lg border border-white/[.07] bg-white/[.025] p-2.5"><p className="text-[15px] font-semibold text-white">—</p><p className="mt-1 text-[8px] text-white/35">Memory</p></div></div>
                  <div className="mt-3 flex items-center justify-between"><span className="text-[9px] text-white/30">Write. Run. Understand.</span><span className="inline-flex items-center gap-2 rounded-lg bg-[#c5f36a] px-3 py-2 text-[9px] font-bold text-[#11170a]"><Zap className="h-3 w-3"/> Run code</span></div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/[.08] bg-[#141d27] px-4 py-3 text-[9px] text-white/35"><span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#c5f36a]"/> Designed around real practice</span><span>APEX / 001</span></div>
          </div>
          <div className="absolute -bottom-7 -left-5 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#151e28] px-4 py-3 shadow-2xl sm:flex"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c5f36a]/10 text-[#c5f36a]"><BrainCircuit className="h-4 w-4"/></span><span><span className="block text-[10px] font-semibold text-white">One intelligence layer</span><span className="mt-1 block text-[9px] text-white/40">Context travels across your workspace</span></span></div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/[.07] bg-[#0d1218] px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5"><p className="text-[9px] font-bold tracking-[.2em] text-white/35">BUILT AROUND THE WHOLE JOURNEY</p><div className="flex flex-wrap gap-x-8 gap-y-3 text-[10px] font-semibold text-white/45"><span className="inline-flex items-center gap-2"><Code2 className="h-3.5 w-3.5"/> LEARN</span><span className="inline-flex items-center gap-2"><Blocks className="h-3.5 w-3.5"/> BUILD</span><span className="inline-flex items-center gap-2"><Trophy className="h-3.5 w-3.5"/> PROVE</span><span className="inline-flex items-center gap-2"><Target className="h-3.5 w-3.5"/> ADVANCE</span></div></div>
      </section>

      <section id="platform" className="relative z-10 mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-[10px] font-bold tracking-[.2em] text-[#c5f36a]">THE APEX ECOSYSTEM</p><h2 className="mt-5 max-w-[570px] text-4xl font-semibold leading-[1.02] tracking-[-.065em] sm:text-6xl">Everything connected.<br/><span className="text-white/35">Nothing random.</span></h2></div><p className="max-w-[500px] text-sm leading-7 text-white/45 lg:justify-self-end">Most tools solve one small part of the journey. APEX is designed to connect the dots: what you learn informs what you practise, what you build becomes evidence, and that evidence shapes your career plan.</p></div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-[24px] border border-white/[.09] bg-white/[.09] sm:grid-cols-2 xl:grid-cols-3">{capabilities.map(item=>{const Icon=item.icon;return <article key={item.n} className="group relative bg-[#0b1016] p-7 transition duration-300 hover:bg-[#111a21] sm:p-8"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl border border-[#c5f36a]/15 bg-[#c5f36a]/[.06] text-[#c5f36a] transition group-hover:bg-[#c5f36a]/[.12]"><Icon className="h-5 w-5"/></span><span className="font-mono text-[10px] text-white/25">{item.n}</span></div><h3 className="mt-8 text-[19px] font-semibold tracking-[-.035em]">{item.title}</h3><p className="mt-3 min-h-[72px] text-[12px] leading-6 text-white/45">{item.desc}</p><div className="mt-6 flex flex-wrap gap-2">{item.tags.map(tag=><span key={tag} className="rounded-full border border-white/[.09] px-2.5 py-1 text-[9px] text-white/40">{tag}</span>)}</div></article>})}</div>
      </section>

      <section id="method" className="relative z-10 overflow-hidden border-y border-white/[.07] bg-[#c5f36a] px-5 py-24 text-[#11170a] sm:px-8 lg:px-12 lg:py-28">
        <div className="pointer-events-none absolute -right-24 -top-36 h-[500px] w-[500px] rounded-full border border-black/[.08]"/><div className="pointer-events-none absolute -right-8 -top-20 h-[360px] w-[360px] rounded-full border border-black/[.08]"/>
        <div className="relative mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-[10px] font-black tracking-[.2em] text-black/45">THE APEX METHOD</p><h2 className="mt-5 max-w-[500px] text-5xl font-semibold leading-[.98] tracking-[-.07em] sm:text-6xl">A better loop changes everything.</h2><p className="mt-6 max-w-[420px] text-sm leading-7 text-black/60">Preparation should compound. Each session should leave you with better understanding, stronger evidence or a clearer next step.</p><a href="/sign-up" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#10150b] px-5 py-3.5 text-[11px] font-bold text-[#c5f36a] transition hover:bg-[#26331a]">Start your journey <ArrowRight className="h-4 w-4"/></a></div>
          <div className="grid gap-3 sm:grid-cols-3">{[{n:"01",t:"Learn",d:"Understand a concept. Ask better questions. Build fundamentals.",i:BookOpen},{n:"02",t:"Build",d:"Solve problems. Ship projects. Create work you can demonstrate.",i:Layers3},{n:"03",t:"Prove",d:"Explain decisions. Practise interviews. Track real progress.",i:ShieldCheck}].map(step=>{const Icon=step.i;return <div key={step.n} className="flex flex-col justify-between rounded-2xl border border-black/10 bg-black/[.045] p-6"><div className="flex items-center justify-between"><span className="font-mono text-[10px] text-black/40">{step.n} / 03</span><Icon className="h-5 w-5 text-black/65"/></div><div className="mt-14"><h3 className="text-2xl font-semibold tracking-[-.05em]">{step.t}</h3><p className="mt-3 text-[11px] leading-6 text-black/55">{step.d}</p></div></div>})}</div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111923] p-8 sm:p-12 lg:p-16"><div className="apex-cta-glow pointer-events-none absolute -right-20 -top-36 h-[430px] w-[430px] rounded-full blur-3xl"/><div className="relative max-w-[720px]"><p className="text-[10px] font-bold tracking-[.2em] text-[#c5f36a]">YOUR NEXT CHAPTER STARTS HERE</p><h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-.065em] sm:text-6xl">Make your skills visible.<br/><span className="text-white/35">Make your next move count.</span></h2><p className="mt-6 max-w-xl text-sm leading-7 text-white/45">Build a stronger foundation, create work worth showing and prepare with a system that keeps the whole journey in view.</p><div className="mt-8 flex flex-wrap gap-3"><a href="/sign-up" className="inline-flex items-center gap-2 rounded-full bg-[#c5f36a] px-6 py-4 text-[11px] font-bold text-[#10150b] transition hover:bg-[#d5ff80]">Create your APEX account <ArrowUpRight className="h-4 w-4"/></a><a href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-4 text-[11px] font-semibold text-white/75 transition hover:bg-white/[.05]">Open workspace <ArrowRight className="h-4 w-4"/></a></div></div></div>
      </section>

      <footer className="relative z-10 border-t border-white/[.08] px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-5 sm:flex-row sm:items-center"><a href="/" className="text-lg font-black tracking-[-.07em]">APEX<span className="text-[#c5f36a]">.</span></a><p className="text-[10px] text-white/30">A career and developer intelligence platform. Built around evidence, not hype.</p><a href="https://github.com/ansh44233/APEX-AI-Career-Developer-Intelligence-Platform" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] text-white/45 transition hover:text-white"><Github className="h-3.5 w-3.5"/> Follow development <ArrowUpRight className="h-3 w-3"/></a></div></footer>
    </main>
  );
}

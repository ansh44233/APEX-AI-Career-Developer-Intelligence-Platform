"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Award, BookOpen, Bot, BrainCircuit, BriefcaseBusiness,
  Check, ChevronRight, Code2, Compass, Crown, Flame, Layers3, LockKeyhole,
  Map, Play, Rocket, ShieldCheck, Sparkles, Target, Trophy, Zap,
} from "lucide-react";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";
import { CareerGoalsPanel } from "@/components/career-goals-panel";

const missions = [
  { id:"learn", category:"LEARN", title:"Understand one core concept", detail:"Choose a topic in your target role and explain it in your own words.", time:"25 min", href:"/features/agent-workbench?skill=career-copilot&prompt=Help me learn a core concept for my target role. Teach me with examples, then check my understanding.", icon:BookOpen, reward:"Knowledge checkpoint" },
  { id:"build", category:"BUILD", title:"Solve a practical engineering challenge", detail:"Write a solution, test edge cases and explain the trade-offs.", time:"40 min", href:"/features/oa-arena", icon:Code2, reward:"Problem-solving proof" },
  { id:"prove", category:"PROVE", title:"Defend one technical decision", detail:"Practise explaining why you chose an approach and what you would improve.", time:"20 min", href:"/features/project-defense", icon:ShieldCheck, reward:"Communication proof" },
];

const tracks = [
  { name:"Problem solving", detail:"Algorithms, patterns, complexity", icon:Code2, href:"/features/oa-arena", stage:"PRACTISE" },
  { name:"Engineering foundations", detail:"APIs, databases, testing, security", icon:Layers3, href:"/features/question-bank", stage:"LEARN" },
  { name:"System architecture", detail:"Scalability, reliability, trade-offs", icon:Map, href:"/features/system-design", stage:"DESIGN" },
  { name:"Interview communication", detail:"Clear explanations and follow-ups", icon:BrainCircuit, href:"/features/mock-interview", stage:"SIMULATE" },
  { name:"Project evidence", detail:"Build, document and defend your work", icon:Rocket, href:"/features/project-defense", stage:"BUILD" },
  { name:"Career strategy", detail:"Roles, companies and applications", icon:Compass, href:"/features/company-intelligence", stage:"EXPLORE" },
];

export default function Dashboard() {
  const [done,setDone]=useState<string[]>([]);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{try{const raw=window.localStorage.getItem("apex-missions-v1");if(raw){const value=JSON.parse(raw);if(Array.isArray(value))setDone(value.filter((x):x is string=>typeof x==="string"));}}catch{}setLoaded(true);},[]);
  useEffect(()=>{if(loaded)window.localStorage.setItem("apex-missions-v1",JSON.stringify(done));},[done,loaded]);
  const completed=useMemo(()=>missions.filter(m=>done.includes(m.id)).length,[done]);
  const next=missions.find(m=>!done.includes(m.id))??missions[0];
  return <ApexWorkspaceShell>
    <section className="relative mb-8 overflow-hidden rounded-[28px] border border-violet-400/20 bg-[#171326] p-6 text-white sm:p-9 lg:p-11">
      <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border border-violet-300/10"/><div className="pointer-events-none absolute -right-4 -top-12 h-56 w-56 rounded-full border border-violet-300/10"/><div className="pointer-events-none absolute bottom-[-110px] right-[20%] h-64 w-64 rounded-full bg-violet-600/20 blur-3xl"/>
      <div className="relative grid gap-8 xl:grid-cols-[1fr_300px] xl:items-center">
        <div><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1.5 text-[9px] font-bold tracking-[.18em] text-violet-200"><Sparkles className="h-3 w-3"/> YOUR CAREER OPERATING SYSTEM</div>
          <h1 className="max-w-3xl text-[clamp(2.4rem,5vw,4.8rem)] font-semibold leading-[.98] tracking-[-.065em]">Build a career<br/><span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-sky-200 bg-clip-text text-transparent">worth showing up for.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-violet-100/65">Learn the fundamentals. Build real things. Practise under pressure. Prove what you can do.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href={next.href} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#171326] transition hover:bg-violet-100"><Play className="h-3.5 w-3.5 fill-current"/> Continue your mission <ArrowUpRight className="h-3.5 w-3.5"/></Link><Link href="/features/agent-workbench" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-xs font-semibold text-white hover:bg-white/10"><Bot className="h-4 w-4"/> Talk to APEX mentor</Link></div>
        </div>
        <div className="relative rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between"><span className="text-[9px] font-bold tracking-[.18em] text-violet-200/70">TODAY'S FIELD NOTES</span><Target className="h-4 w-4 text-violet-200"/></div>
          <div className="mt-6 flex items-end gap-2"><span className="text-5xl font-semibold tracking-[-.06em]">{completed}</span><span className="pb-1 text-sm text-violet-100/55">/ {missions.length} missions</span></div>
          <div className="mt-4 flex gap-1.5">{missions.map(m=><span key={m.id} className={`h-1.5 flex-1 rounded-full ${done.includes(m.id)?"bg-violet-300":"bg-white/15"}`}/>)}</div>
          <p className="mt-4 text-[11px] leading-5 text-violet-100/55">Your checklist is saved in this browser. Progress reflects only the missions you mark complete here.</p>
          <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] text-violet-100/70"><Zap className="h-3.5 w-3.5 text-amber-300"/> Consistency over intensity.</div>
        </div>
      </div>
    </section>

    <section className="mb-9 grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><p className="text-[9px] font-bold tracking-[.18em] text-violet-500">MISSION CONTROL / DAILY LOOP</p><h2 className="mt-1.5 text-xl font-semibold tracking-tight">Make today count.</h2></div><span className="rounded-full border border-[var(--line)] px-3 py-1 text-[9px] text-[var(--muted)]">~85 MIN</span></div>
        <div className="space-y-2">{missions.map((mission,i)=>{const Icon=mission.icon;const isDone=done.includes(mission.id);return <div key={mission.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${isDone?"border-violet-400/25 bg-violet-500/[.06]":"border-[var(--line)] bg-[var(--panel-raised)]"}`}>
          <button onClick={()=>setDone(current=>isDone?current.filter(x=>x!==mission.id):[...current,mission.id])} aria-label={isDone?"Mark mission incomplete":"Mark mission complete"} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${isDone?"border-violet-400 bg-violet-500 text-white":"border-[var(--line)] text-[var(--muted)] hover:border-violet-400"}`}>{isDone?<Check className="h-4 w-4"/>:<Icon className="h-4 w-4"/>}</button>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[8px] font-bold tracking-[.15em] text-violet-500">{mission.category}</span>{isDone&&<span className="text-[8px] font-bold text-emerald-500">COMPLETED</span>}</div><p className={`mt-1 text-xs font-semibold ${isDone?"text-[var(--muted)] line-through":""}`}>{mission.title}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{mission.detail}</p></div>
          <div className="hidden text-right sm:block"><p className="text-[9px] text-[var(--muted)]">{mission.time}</p><Link href={mission.href} className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-violet-500">Open <ArrowUpRight className="h-3 w-3"/></Link></div>
        </div>})}</div>
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><p className="text-[9px] font-bold tracking-[.18em] text-violet-500">YOUR NEXT MOVE</p><h2 className="mt-1.5 text-xl font-semibold">One clear step.</h2></div><div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><Compass className="h-4 w-4"/></div></div>
        <div className="mt-6 rounded-xl border border-violet-400/20 bg-violet-500/[.06] p-4"><p className="text-[9px] font-bold tracking-[.16em] text-violet-500">RECOMMENDED NEXT</p><h3 className="mt-2 text-base font-semibold">{next.title}</h3><p className="mt-2 text-[11px] leading-5 text-[var(--muted)]">{next.detail}</p><Link href={next.href} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-500 px-3 py-2 text-[10px] font-bold text-white hover:bg-violet-400">Start this mission <ArrowRight className="h-3 w-3"/></Link></div>
        <div className="mt-5 flex items-start gap-2 text-[10px] leading-5 text-[var(--muted)]"><Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500"/> Mark a mission complete only when you've actually done the work. APEX is about evidence, not empty points.</div>
      </div>
    </section>

    <section className="mb-9">
      <div className="mb-4 flex items-end justify-between"><div><p className="text-[9px] font-bold tracking-[.18em] text-violet-500">CAREER MAP / SIX DOMAINS</p><h2 className="mt-1.5 text-2xl font-semibold tracking-tight">Your skill universe.</h2><p className="mt-1 text-xs text-[var(--muted)]">Choose a domain. Learn it, practise it, create proof.</p></div><span className="hidden text-[9px] text-[var(--muted)] sm:block">A learning map, not a scorecard</span></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{tracks.map((track,i)=>{const Icon=track.icon;return <Link key={track.name} href={track.href} className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/40"><div className="absolute -right-8 -top-8 h-28 w-28 rounded-full border border-violet-400/10 transition group-hover:scale-125"/><div className="relative flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><Icon className="h-5 w-5"/></div><span className="text-[8px] font-bold tracking-[.15em] text-[var(--muted)]">0{i+1} / {track.stage}</span></div><h3 className="relative mt-6 text-sm font-semibold">{track.name}</h3><p className="relative mt-1 text-[10px] text-[var(--muted)]">{track.detail}</p><div className="relative mt-5 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[10px] font-semibold text-violet-500"><span>Enter workspace</span><ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></div></Link>})}</div>
    </section>

    <section className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6"><div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><Crown className="h-5 w-5"/></div><div><h2 className="text-base font-semibold">Career direction</h2><p className="mt-1 text-[10px] text-[var(--muted)]">Set your target role and keep your preparation focused.</p></div></div><CareerGoalsPanel/></section>
  </ApexWorkspaceShell>;
}

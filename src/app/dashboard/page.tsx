"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Check, Code2, Compass, Layers3, BrainCircuit, Rocket, ShieldCheck, Target, Play } from "lucide-react";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";
import { CareerGoalsPanel } from "@/components/career-goals-panel";

const missions = [
  { id:"learn", category:"01 / LEARN", title:"Understand one core concept", detail:"Choose a topic in your target role and explain it in your own words.", time:"25 min", href:"/features/agent-workbench?skill=career-copilot&prompt=Help me learn a core concept for my target role. Teach me with examples, then check my understanding.", icon:BookOpen },
  { id:"build", category:"02 / BUILD", title:"Solve a practical engineering challenge", detail:"Write a solution, test edge cases and explain the trade-offs.", time:"40 min", href:"/features/oa-arena", icon:Code2 },
  { id:"prove", category:"03 / PROVE", title:"Defend one technical decision", detail:"Practise explaining why you chose an approach and what you would improve.", time:"20 min", href:"/features/project-defense", icon:ShieldCheck },
];

const tracks = [
  { name:"Problem solving", detail:"Algorithms, patterns, complexity", icon:Code2, href:"/features/oa-arena", stage:"PRACTISE" },
  { name:"Engineering foundations", detail:"APIs, databases, testing, security", icon:Layers3, href:"/features/question-bank", stage:"LEARN" },
  { name:"System architecture", detail:"Scalability, reliability, trade-offs", icon:Compass, href:"/features/system-design", stage:"DESIGN" },
  { name:"Interview communication", detail:"Clear explanations and follow-ups", icon:BrainCircuit, href:"/features/mock-interview", stage:"SIMULATE" },
  { name:"Project evidence", detail:"Build, document and defend your work", icon:Rocket, href:"/features/project-defense", stage:"BUILD" },
  { name:"Career strategy", detail:"Roles, companies and applications", icon:Target, href:"/features/company-intelligence", stage:"EXPLORE" },
];

export default function Dashboard() {
  const [done,setDone]=useState<string[]>([]);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{try{const raw=window.localStorage.getItem("apex-missions-v1");if(raw){const value=JSON.parse(raw);if(Array.isArray(value))setDone(value.filter((x):x is string=>typeof x==="string"));}}catch{}setLoaded(true);},[]);
  useEffect(()=>{if(loaded)window.localStorage.setItem("apex-missions-v1",JSON.stringify(done));},[done,loaded]);
  const completed=useMemo(()=>missions.filter(m=>done.includes(m.id)).length,[done]);
  const next=missions.find(m=>!done.includes(m.id))??missions[0];
  return <ApexWorkspaceShell>
    <section className="mb-10 grid gap-8 rounded-[28px] border border-[var(--line)] bg-[var(--panel)] p-6 sm:p-9 lg:grid-cols-[1fr_260px] lg:items-end">
      <div>
        <p className="mb-5 text-[10px] font-bold tracking-[.2em] text-[#3559d8]">APEX / YOUR CAREER WORKSPACE</p>
        <h1 className="max-w-3xl text-[clamp(2.5rem,5vw,4.7rem)] font-semibold leading-[.98] tracking-[-.065em] text-[var(--text)]">Make your next<br/><span className="text-[#3559d8]">move meaningful.</span></h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--muted)]">A place to learn the fundamentals, build real things and show what you can do. No made-up scores. Just work that moves you forward.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={next.href} className="inline-flex items-center gap-2 rounded-xl bg-[#263f9e] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#3559d8]"><Play className="h-3.5 w-3.5 fill-current"/> Continue your work <ArrowUpRight className="h-3.5 w-3.5"/></Link>
          <Link href="/features/agent-workbench" className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-5 py-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--hover)]">Meet your mentor <ArrowUpRight className="h-3.5 w-3.5"/></Link>
        </div>
      </div>
      <aside className="border-t border-[var(--line)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <p className="text-[10px] font-bold tracking-[.17em] text-[var(--muted)]">TODAY'S FIELD NOTES</p>
        <div className="mt-4 flex items-baseline gap-2"><span className="text-5xl font-semibold tracking-[-.06em] text-[var(--text)]">{completed}</span><span className="text-sm text-[var(--muted)]">of {missions.length} checked off</span></div>
        <div className="mt-4 flex gap-1.5">{missions.map(m=><span key={m.id} className={`h-1.5 flex-1 rounded-full ${done.includes(m.id)?"bg-[#3559d8]":"bg-[var(--line)]"}`}/>)}</div>
        <p className="mt-4 text-[11px] leading-5 text-[var(--muted)]">This checklist is saved in this browser. It only reflects work you mark complete.</p>
      </aside>
    </section>

    <section className="mb-11 grid gap-8 xl:grid-cols-[1.15fr_.85fr]">
      <div>
        <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[.18em] text-[#3559d8]">THE DAILY LOOP</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)]">Learn. Build. Prove.</h2></div><span className="text-[10px] text-[var(--muted)]">About 85 min</span></div>
        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">{missions.map((mission)=>{const Icon=mission.icon;const isDone=done.includes(mission.id);return <article key={mission.id} className="flex items-center gap-4 py-5">
          <button onClick={()=>setDone(current=>isDone?current.filter(x=>x!==mission.id):[...current,mission.id])} aria-label={isDone?"Mark incomplete":"Mark complete"} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${isDone?"border-[#3559d8] bg-[#3559d8] text-white":"border-[var(--line)] text-[var(--muted)] hover:border-[#3559d8]"}`}>{isDone?<Check className="h-4 w-4"/>:<Icon className="h-4 w-4"/>}</button>
          <div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-[.16em] text-[#3559d8]">{mission.category}{isDone?" · DONE":""}</p><h3 className={`mt-1 text-sm font-semibold text-[var(--text)] ${isDone?"line-through opacity-60":""}`}>{mission.title}</h3><p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">{mission.detail}</p></div>
          <div className="hidden text-right sm:block"><p className="text-[10px] text-[var(--muted)]">{mission.time}</p><Link href={mission.href} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#3559d8]">Open <ArrowUpRight className="h-3 w-3"/></Link></div>
        </article>})}</div>
      </div>
      <aside className="self-start rounded-2xl border border-[var(--line)] bg-[#263f9e] p-6 text-white">
        <p className="text-[9px] font-bold tracking-[.2em] text-white/65">A GOOD NEXT STEP</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight">{next.title}</h2>
        <p className="mt-3 text-xs leading-6 text-white/70">{next.detail}</p>
        <Link href={next.href} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#fffdf8] px-4 py-2.5 text-xs font-bold text-[#263f9e]">Start here <ArrowUpRight className="h-3.5 w-3.5"/></Link>
        <div className="mt-8 border-t border-white/20 pt-4 text-[10px] leading-5 text-white/60">Progress means completed work and evidence you can explain. APEX won't invent achievements for you.</div>
      </aside>
    </section>

    <section className="mb-11">
      <div className="mb-5"><p className="text-[10px] font-bold tracking-[.18em] text-[#3559d8]">YOUR LEARNING MAP</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)]">Choose a direction.</h2><p className="mt-1 text-xs text-[var(--muted)]">Pick a domain, practise it and create proof of your work.</p></div>
      <div className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">{tracks.map((track,i)=>{const Icon=track.icon;return <Link key={track.name} href={track.href} className="group border-t border-[var(--line)] py-5 transition hover:border-[#3559d8]"><div className="flex items-center justify-between"><span className="text-[10px] font-bold tracking-[.15em] text-[var(--muted)]">0{i+1} / {track.stage}</span><Icon className="h-4 w-4 text-[#3559d8]"/></div><h3 className="mt-4 text-base font-semibold text-[var(--text)]">{track.name}</h3><p className="mt-1 text-[11px] text-[var(--muted)]">{track.detail}</p><span className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#3559d8]">Explore <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5"/></span></Link>})}</div>
    </section>

    <section className="border-t border-[var(--line)] pt-7"><div className="mb-4"><p className="text-[10px] font-bold tracking-[.18em] text-[#3559d8]">YOUR DIRECTION</p><h2 className="mt-1 text-xl font-semibold text-[var(--text)]">Career goals</h2><p className="mt-1 text-xs text-[var(--muted)]">Set a target role and keep your preparation focused.</p></div><CareerGoalsPanel/></section>
  </ApexWorkspaceShell>;
}

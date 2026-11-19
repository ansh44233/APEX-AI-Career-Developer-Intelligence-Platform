import { AccountControl } from "@/components/account-control";
import {
  ArrowRight, ArrowUpRight, BookOpen, BrainCircuit, BriefcaseBusiness, Code2,
  FileSearch, Gauge, Layers3, LayoutDashboard, MessageSquareText, Search,
  ShieldCheck, Sparkles, Target, Zap,
} from "lucide-react";

const primary = [
  { title: "AI Career Agent", description: "Plan next steps, practise skills and work through career questions.", icon: Sparkles, href: "/features/agent-workbench", tag: "COPILOT", featured: true },
  { title: "Mock interviews", description: "Practise technical, behavioural and system-design rounds.", icon: BrainCircuit, href: "/features/mock-interview", tag: "PRACTISE", featured: true },
  { title: "Coding arena", description: "Build problem-solving fluency with focused assessments.", icon: Code2, href: "/features/oa-arena", tag: "ASSESS", featured: true },
  { title: "Company intelligence", description: "Explore source-linked company research and role preparation.", icon: BriefcaseBusiness, href: "/features/company-intelligence", tag: "RESEARCH", featured: true },
];
const tools = [
  { title: "Resume intelligence", description: "Compare your resume with a target role.", icon: FileSearch, href: "/features/resume-intelligence" },
  { title: "Job intelligence", description: "Turn a job description into preparation tasks.", icon: Search, href: "/features/job-intelligence" },
  { title: "Question bank", description: "Explore role-based prompts, hints and rubrics.", icon: BookOpen, href: "/features/question-bank" },
  { title: "System design studio", description: "Practise architecture and engineering trade-offs.", icon: Layers3, href: "/features/system-design" },
  { title: "Readiness engine", description: "Review your skills and preparation priorities.", icon: Gauge, href: "/features/readiness-engine" },
  { title: "Project defense", description: "Explain your technical decisions with confidence.", icon: ShieldCheck, href: "/features/project-defense" },
  { title: "Interview experiences", description: "Read moderated community interview reports.", icon: MessageSquareText, href: "/features/interview-experiences" },
  { title: "Career command center", description: "Connect goals, applications and next actions.", icon: Target, href: "/features/career-command-center" },
];

function Card({ item }: { item: (typeof primary)[number] | (typeof tools)[number] }) {
  const Icon = item.icon;
  return <a href={item.href} className="group flex min-h-40 flex-col rounded-2xl border border-white/[0.08] bg-[#11150f] p-5 transition hover:-translate-y-0.5 hover:border-[#c6ff3d]/35 hover:bg-[#151b11] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c6ff3d]">
    <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl border border-[#c6ff3d]/15 bg-[#c6ff3d]/[0.07] text-[#d8ff83]"><Icon className="h-5 w-5"/></span><span className="text-[9px] font-bold tracking-[0.16em] text-zinc-600">{"tag" in item ? item.tag : "EXPLORE"}</span></div>
    <h3 className="mt-5 text-sm font-semibold text-white">{item.title}</h3><p className="mt-2 flex-1 text-xs leading-5 text-zinc-500">{item.description}</p>
    <span className="mt-4 inline-flex items-center text-xs font-semibold text-[#c6ff3d]">Open <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5"/></span>
  </a>;
}

export default function Dashboard() {
  return <main className="min-h-screen bg-[#080a08] text-white lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
    <aside className="hidden border-r border-white/[0.07] bg-[#0b0e09] px-5 py-7 lg:flex lg:flex-col">
      <a href="/" className="mb-10 flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c6ff3d] text-sm font-black text-[#0b0d08]">A</span><span className="text-lg font-extrabold tracking-[0.16em]">APEX<span className="text-[#c6ff3d]">.</span></span></a>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">Workspace</p>
      <nav className="space-y-1 text-sm">
        <a href="/dashboard" className="flex items-center gap-3 rounded-xl border border-[#c6ff3d]/15 bg-[#c6ff3d]/[0.07] px-3 py-3 text-[#d8ff83]"><LayoutDashboard className="h-4 w-4"/> Overview</a>
        <a href="/features/agent-workbench" className="flex items-center gap-3 rounded-xl px-3 py-3 text-zinc-400 hover:bg-white/[0.04] hover:text-white"><Sparkles className="h-4 w-4"/> AI Agent</a>
        <a href="/features/mock-interview" className="flex items-center gap-3 rounded-xl px-3 py-3 text-zinc-400 hover:bg-white/[0.04] hover:text-white"><BrainCircuit className="h-4 w-4"/> Interview Lab</a>
        <a href="/features/oa-arena" className="flex items-center gap-3 rounded-xl px-3 py-3 text-zinc-400 hover:bg-white/[0.04] hover:text-white"><Code2 className="h-4 w-4"/> Coding Arena</a>
        <a href="/features/company-intelligence" className="flex items-center gap-3 rounded-xl px-3 py-3 text-zinc-400 hover:bg-white/[0.04] hover:text-white"><BriefcaseBusiness className="h-4 w-4"/> Company Intel</a>
      </nav>
      <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-sm font-semibold">One step at a time.</p><p className="mt-2 text-xs leading-5 text-zinc-500">Choose a goal, practise with focus, and keep your progress visible.</p></div>
    </aside>
    <section className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="mb-8 flex items-center justify-between gap-4"><a href="/" className="flex items-center gap-2 lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c6ff3d] font-black text-[#0b0d08]">A</span><span className="font-extrabold tracking-[0.16em]">APEX<span className="text-[#c6ff3d]">.</span></span></a><div className="hidden lg:block"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c6ff3d]">YOUR WORKSPACE</p><p className="mt-1 text-sm text-zinc-500">Overview <span className="text-zinc-700">/</span> Dashboard</p></div><div className="ml-auto flex items-center gap-3"><a href="/features/agent-workbench" className="hidden items-center gap-2 rounded-xl border border-[#c6ff3d]/20 bg-[#c6ff3d]/[0.06] px-3 py-2.5 text-xs font-semibold text-[#d8ff83] sm:inline-flex"><Sparkles className="h-4 w-4"/> Open AI Agent</a><AccountControl/></div></header>
      <section className="relative mb-9 overflow-hidden rounded-[26px] border border-[#c6ff3d]/20 bg-[radial-gradient(ellipse_at_85%_10%,rgba(198,255,61,0.16),transparent_38%),linear-gradient(125deg,#192014,#0d100c_68%)] p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full border border-[#c6ff3d]/10"/>
        <div className="relative max-w-3xl"><p className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#d8ff83]"><Zap className="h-4 w-4"/> CAREER INTELLIGENCE WORKSPACE</p><h1 className="text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">Build skills. <span className="text-[#c6ff3d]">Move forward.</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">Your focused space for interview preparation, coding practice, company research and career decisions.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/features/agent-workbench" className="inline-flex items-center gap-2 rounded-xl bg-[#c6ff3d] px-4 py-3 text-sm font-bold text-[#0b0d08] hover:bg-[#d8ff83]"><Sparkles className="h-4 w-4"/> Talk to APEX Agent</a><a href="/features/mock-interview" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.08]"><BrainCircuit className="h-4 w-4"/> Start an interview</a></div></div>
      </section>
      <section className="mb-10"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c6ff3d]">START HERE</p><h2 className="mt-1 text-xl font-semibold">Your core workspace</h2><p className="mt-1 text-xs text-zinc-500">Four clear starting points. Open one and get to work.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{primary.map(item=><Card key={item.title} item={item}/>)}</div></section>
      <section className="mb-10"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c6ff3d]">EXPLORE MORE</p><h2 className="mt-1 text-xl font-semibold">Career tools</h2></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{tools.map(item=><Card key={item.title} item={item}/>)}</div></section>
      <footer className="flex flex-col gap-2 border-t border-white/[0.07] pt-6 text-[11px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between"><span>APEX · Your work, your progress, your next move.</span><a href="/features/career-command-center" className="text-[#c6ff3d] hover:text-white">Open career command center <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a></footer>
    </section>
  </main>;
}

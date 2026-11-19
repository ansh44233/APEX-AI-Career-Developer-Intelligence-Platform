import { AccountControl } from "@/components/account-control";
import { CareerGoalsPanel } from "@/components/career-goals-panel";
import {
  ArrowRight, ArrowUpRight, BookOpen, Bot, BrainCircuit, BriefcaseBusiness,
  Code2, FileText, Gauge, LayoutDashboard, Search, ShieldCheck, Sparkles, Target,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI career agent", href: "/features/agent-workbench", icon: Bot },
  { label: "Interview lab", href: "/features/mock-interview", icon: BrainCircuit },
  { label: "Coding practice", href: "/features/oa-arena", icon: Code2 },
  { label: "Company research", href: "/features/company-intelligence", icon: BriefcaseBusiness },
];
const workspaces = [
  { title: "AI Career Agent", description: "Get guidance grounded in your goals, applications and preparation history.", href: "/features/agent-workbench", icon: Bot, eyebrow: "YOUR COPILOT", featured: true },
  { title: "Interview Lab", description: "Practise behavioural, technical and system-design questions.", href: "/features/mock-interview", icon: BrainCircuit, eyebrow: "PRACTISE", featured: true },
  { title: "Coding Arena", description: "Build problem-solving habits with structured coding exercises.", href: "/features/oa-arena", icon: Code2, eyebrow: "BUILD SKILLS", featured: true },
  { title: "Company Intelligence", description: "Explore company and role research with source context.", href: "/features/company-intelligence", icon: BriefcaseBusiness, eyebrow: "RESEARCH", featured: true },
];
const tools = [
  { title: "Resume review", description: "Compare your experience with a target role.", href: "/features/resume-intelligence", icon: FileText },
  { title: "Job intelligence", description: "Turn a job description into preparation tasks.", href: "/features/job-intelligence", icon: Search },
  { title: "Question bank", description: "Browse prompts, hints and evaluation rubrics.", href: "/features/question-bank", icon: BookOpen },
  { title: "System design", description: "Practise architecture and engineering trade-offs.", href: "/features/system-design", icon: Gauge },
  { title: "Project defence", description: "Prepare to explain your technical decisions.", href: "/features/project-defense", icon: ShieldCheck },
  { title: "Career command centre", description: "Connect goals, applications and next actions.", href: "/features/career-command-center", icon: Target },
];

function WorkspaceCard({ item }: { item: (typeof workspaces)[number] }) {
  const Icon = item.icon;
  return <a href={item.href} className="group flex min-h-[218px] flex-col rounded-2xl border border-white/[0.09] bg-[#121a27] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#b9f36b]/45 hover:bg-[#172233] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b9f36b]">
    <div className="flex items-center justify-between">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#b9f36b]/20 bg-[#b9f36b]/10 text-[#c9f98a]"><Icon className="h-5 w-5"/></span>
      <span className="text-[10px] font-semibold tracking-[0.16em] text-[#9aa9bd]">{item.eyebrow}</span>
    </div>
    <h3 className="mt-6 text-base font-semibold text-white">{item.title}</h3>
    <p className="mt-2 flex-1 text-sm leading-6 text-[#9aa9bd]">{item.description}</p>
    <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#c9f98a]">Open workspace <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5"/></span>
  </a>;
}

export default function Dashboard() {
  return <main className="min-h-screen bg-[#0b1220] text-white lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
    <aside className="hidden border-r border-white/[0.07] bg-[#0d1726] px-5 py-7 lg:flex lg:flex-col">
      <a href="/dashboard" className="mb-10 flex items-center gap-3 px-2" aria-label="APEX home">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#b9f36b] text-lg font-black text-[#101a12]">A</span>
        <span className="text-xl font-black tracking-[0.14em]">APEX<span className="text-[#b9f36b]">.</span><span className="mt-0.5 block text-[9px] font-semibold tracking-[0.22em] text-[#71839b]">CAREER WORKSPACE</span></span>
      </a>
      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#71839b]">Workspace</p>
      <nav className="space-y-1">
        {navigation.map((item, index) => { const Icon = item.icon; return <a key={item.href} href={item.href} aria-current={index === 0 ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${index === 0 ? "border border-[#b9f36b]/20 bg-[#b9f36b]/[0.08] font-semibold text-[#d2f9a1]" : "text-[#9aa9bd] hover:bg-white/[0.05] hover:text-white"}`}><Icon className="h-[18px] w-[18px]"/>{item.label}</a>; })}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-[#c9f98a]"><Target className="h-4 w-4"/><p className="text-xs font-semibold">Make progress visible</p></div>
        <p className="mt-2 text-xs leading-5 text-[#8292a8]">Set a target role, practise deliberately, and use your feedback to decide what comes next.</p>
      </div>
    </aside>

    <section className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="mb-8 flex items-center justify-between gap-4">
        <a href="/dashboard" className="flex items-center gap-2 lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#b9f36b] font-black text-[#101a12]">A</span><span className="font-black tracking-[0.14em]">APEX<span className="text-[#b9f36b]">.</span></span></a>
        <div className="hidden lg:block"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b9f36b]">YOUR CAREER WORKSPACE</p><p className="mt-1 text-sm text-[#8292a8]">Overview <span className="px-1 text-[#526178]">/</span> Dashboard</p></div>
        <div className="ml-auto flex items-center gap-3"><a href="/features/agent-workbench" className="inline-flex items-center gap-2 rounded-xl bg-[#b9f36b] px-3.5 py-2.5 text-xs font-bold text-[#101a12] transition hover:bg-[#d0f99a]"><Sparkles className="h-4 w-4"/> Ask APEX</a><AccountControl/></div>
      </header>

      <section className="relative mb-9 overflow-hidden rounded-[28px] border border-[#b9f36b]/20 bg-[radial-gradient(ellipse_at_88%_12%,rgba(185,243,107,0.15),transparent_36%),linear-gradient(120deg,#18283a,#101a2a_60%,#111b29)] p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-12 -top-24 h-80 w-80 rounded-full border border-[#b9f36b]/10"/><div className="pointer-events-none absolute right-12 top-10 h-44 w-44 rounded-full border border-[#b9f36b]/[0.07]"/>
        <div className="relative max-w-3xl">
          <p className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#c9f98a]"><Sparkles className="h-4 w-4"/> ONE PLACE TO MOVE YOUR CAREER FORWARD</p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-[1.12] tracking-[-0.04em] sm:text-5xl">Know what to do next.<br/><span className="text-[#c9f98a]">Then get better at it.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-[#a2b0c2]">Plan your preparation, practise real skills and keep your career work organised in one workspace.</p>
          <div className="mt-7 flex flex-wrap gap-3"><a href="/features/agent-workbench" className="inline-flex items-center gap-2 rounded-xl bg-[#b9f36b] px-4 py-3 text-sm font-bold text-[#101a12] hover:bg-[#d0f99a]"><Bot className="h-4 w-4"/> Talk to your AI agent</a><a href="/features/mock-interview" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.09]"><BrainCircuit className="h-4 w-4"/> Practise an interview</a></div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9f36b]">START HERE</p><h2 className="mt-1 text-xl font-semibold">Your main workspaces</h2><p className="mt-1 text-sm text-[#8292a8]">Start with one of these. Each has a clear job.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">{workspaces.map(item => <WorkspaceCard key={item.title} item={item}/>)}</div>
      </section>

      <section className="mb-10">
        <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9f36b]">SUPPORTING TOOLS</p><h2 className="mt-1 text-xl font-semibold">More ways to prepare</h2><p className="mt-1 text-sm text-[#8292a8]">Use these when they match the task you're working on.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{tools.map(item => { const Icon = item.icon; return <a key={item.href} href={item.href} className="group flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-[#111b2a] p-4 transition hover:border-white/20 hover:bg-[#172437]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-[#b9f36b]"><Icon className="h-5 w-5"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-xs leading-5 text-[#8292a8]">{item.description}</span></span><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#64758b] transition group-hover:translate-x-1 group-hover:text-[#c9f98a]"/></a>; })}</div>
      </section>

      <section className="mb-10 rounded-3xl border border-white/[0.08] bg-[#101a29] p-4 sm:p-6"><div className="mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-[#b9f36b]"/><div><h2 className="text-base font-semibold">Your career goals</h2><p className="mt-1 text-xs text-[#8292a8]">Keep your target role and preparation plan in one place.</p></div></div><CareerGoalsPanel/></section>
      <footer className="flex flex-col gap-2 border-t border-white/[0.08] pt-6 text-[11px] text-[#71839b] sm:flex-row sm:items-center sm:justify-between"><span>APEX · Your work, your progress, your next move.</span><span>Built to help you prepare with purpose.</span></footer>
    </section>
  </main>;
}

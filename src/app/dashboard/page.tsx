import { AccountControl } from "@/components/account-control";
import { CareerGoalsPanel } from "@/components/career-goals-panel";
import {
  ArrowRight, ArrowUpRight, BookOpen, Bot, BrainCircuit, BriefcaseBusiness,
  Code2, FileText, Gauge, LayoutDashboard, Search, ShieldCheck, Sparkles, Target,
  Compass, Layers3, GraduationCap,
} from "lucide-react";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Career agent", href: "/features/agent-workbench", icon: Bot },
  { label: "Interview studio", href: "/features/mock-interview", icon: BrainCircuit },
  { label: "Coding practice", href: "/features/oa-arena", icon: Code2 },
  { label: "Company intel", href: "/features/company-intelligence", icon: BriefcaseBusiness },
];

const paths = [
  { number: "01", title: "Getting hired", description: "Build a sharper profile and understand what a role asks for.", items: [
    { title: "Resume review", detail: "Make every bullet clearer and more relevant.", href: "/features/resume-intelligence", icon: FileText },
    { title: "Job intelligence", detail: "Turn a job description into a practical checklist.", href: "/features/job-intelligence", icon: Search },
    { title: "Company research", detail: "Understand teams, roles and interview context.", href: "/features/company-intelligence", icon: BriefcaseBusiness },
  ]},
  { number: "02", title: "Interview rounds", description: "Practise the way you will be evaluated, one skill at a time.", items: [
    { title: "Interview studio", detail: "Work through behavioural and technical rounds.", href: "/features/mock-interview", icon: BrainCircuit },
    { title: "Question bank", detail: "Explore prompts, hints and evaluation rubrics.", href: "/features/question-bank", icon: BookOpen },
    { title: "System design", detail: "Explain architecture and engineering trade-offs.", href: "/features/system-design", icon: Gauge },
  ]},
  { number: "03", title: "Build proof", description: "Turn what you know into work you can confidently explain.", items: [
    { title: "Coding arena", detail: "Strengthen problem-solving with structured practice.", href: "/features/oa-arena", icon: Code2 },
    { title: "Project defence", detail: "Prepare to explain your implementation decisions.", href: "/features/project-defense", icon: ShieldCheck },
    { title: "Career command centre", detail: "Keep goals, applications and next actions together.", href: "/features/career-command-center", icon: Target },
  ]},
];

function Brand({ compact = false }: { compact?: boolean }) {
  return <a href="/dashboard" className="flex items-center gap-3" aria-label="APEX home">
    <svg viewBox="0 0 64 64" aria-hidden="true" className="h-9 w-9 shrink-0">
      <defs><linearGradient id="apex-brand-gradient" x1="8" y1="56" x2="54" y2="8" gradientUnits="userSpaceOnUse"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#c4b5fd"/></linearGradient></defs>
      <rect width="64" height="64" rx="16" fill="#171323"/>
      <path d="M12 48 29 14q2-4 5 0l18 34H39L32 34l-7 14H12Z" fill="url(#apex-brand-gradient)"/>
      <path d="M8 42c11-9 26-16 46-19-8 7-17 14-28 21" fill="none" stroke="#ede9fe" strokeWidth="3.2" strokeLinecap="round"/>
      <circle cx="49" cy="13" r="2.4" fill="#c4b5fd"/>
    </svg>
    <span className={compact ? "text-lg font-black tracking-[-0.06em]" : "text-xl font-black tracking-[-0.06em]"}>APEX<span className="text-[#a78bfa]">.</span><span className="ml-2 text-[9px] font-semibold tracking-[0.18em] text-[#849080]">BEYOND LIMITS</span></span>
  </a>;
}

export default function Dashboard() {
  return <main className="min-h-screen bg-[#0b0e0b] text-[#f2f4ec] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="hidden border-r border-white/[0.08] bg-[#0d110d] px-5 py-7 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <Brand />
      <div className="mt-12">
        <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#687365]">Workspace</p>
        <nav className="space-y-1">
          {navigation.map((item, i) => { const Icon = item.icon; return <a key={item.href} href={item.href} aria-current={i === 0 ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] transition ${i === 0 ? "bg-[#c8fa78]/[0.10] text-[#d8ff9d]" : "text-[#9aa394] hover:bg-white/[0.045] hover:text-white"}`}><Icon className="h-[17px] w-[17px]"/>{item.label}{i===0&&<span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c8fa78]"/>}</a>; })}
        </nav>
      </div>
      <div className="mt-10">
        <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#687365]">Your toolkit</p>
        <a href="/features/agent-workbench" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] text-[#9aa394] transition hover:bg-white/[0.045] hover:text-white"><Sparkles className="h-[17px] w-[17px]"/> Ask APEX</a>
        <a href="/features/career-command-center" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] text-[#9aa394] transition hover:bg-white/[0.045] hover:text-white"><Compass className="h-[17px] w-[17px]"/> Career goals</a>
      </div>
      <div className="mt-auto rounded-2xl border border-white/[0.08] bg-[#141a13] p-4">
        <div className="flex items-center gap-2 text-[#c8fa78]"><Target className="h-4 w-4"/><p className="text-[11px] font-semibold">Make progress count</p></div>
        <p className="mt-2 text-[11px] leading-5 text-[#899484]">Small, deliberate practice beats a giant to-do list. Pick one next step and start.</p>
      </div>
      <p className="mt-5 px-3 text-[9px] tracking-wide text-[#586253]">APEX WORKSPACE · V1.0</p>
    </aside>

    <section className="mx-auto w-full max-w-[1480px] px-5 pb-12 pt-5 sm:px-8 lg:px-12 lg:pt-8">
      <header className="mb-12 flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="lg:hidden"><Brand compact /></div>
        <div className="hidden lg:block"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#83907d]">Thursday, your workspace</p><p className="mt-1 text-xs text-[#697466]">Overview <span className="px-1.5 text-[#414a3e]">/</span> Dashboard</p></div>
        <div className="ml-auto flex items-center gap-3"><a href="/features/agent-workbench" className="inline-flex items-center gap-2 rounded-full bg-[#c8fa78] px-4 py-2.5 text-[11px] font-bold text-[#11150d] transition hover:bg-[#dcff9e]"><Sparkles className="h-3.5 w-3.5"/> Ask APEX <ArrowUpRight className="h-3.5 w-3.5"/></a><AccountControl/></div>
      </header>

      <section className="mb-16 grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-end">
        <div className="max-w-4xl">
          <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c8fa78]"><span className="h-px w-6 bg-[#c8fa78]"/> Your next chapter starts here</p>
          <h1 className="max-w-4xl text-[clamp(2.7rem,6vw,5.8rem)] font-semibold leading-[0.98] tracking-[-0.075em]">Get ready for the<br/><span className="text-[#c8fa78]">work you want.</span></h1>
          <p className="mt-6 max-w-xl text-[14px] leading-7 text-[#9aa394]">A focused workspace for building skills, preparing for interviews and making your next career move with intent.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href="/features/mock-interview" className="inline-flex items-center gap-2 rounded-full bg-[#f1f4e9] px-5 py-3 text-[12px] font-bold text-[#171b14] transition hover:bg-white">Start interview practice <ArrowUpRight className="h-4 w-4"/></a><a href="/features/agent-workbench" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[12px] font-semibold text-[#e3e8dc] transition hover:border-[#c8fa78]/50 hover:text-[#d8ff9d]">Open career agent <ArrowRight className="h-4 w-4"/></a></div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-[#c8fa78]/20 bg-[#151d12] p-5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-[#c8fa78]/10"/><div className="absolute -right-1 top-0 h-20 w-20 rounded-full border border-[#c8fa78]/10"/>
          <div className="relative"><div className="flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#9eaa91]">The APEX approach</span><Layers3 className="h-4 w-4 text-[#c8fa78]"/></div><p className="mt-5 text-2xl font-semibold leading-tight tracking-[-0.04em]">Learn it.<br/>Practise it.<br/><span className="text-[#c8fa78]">Prove it.</span></p><p className="mt-4 text-[11px] leading-5 text-[#8c9984]">A simple loop for turning preparation into demonstrable skills.</p></div>
        </div>
      </section>

      <section className="mb-16">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c8fa78]">Pick up where it matters</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">Your career toolkit</h2></div><span className="hidden text-[10px] text-[#71806c] sm:block">A practical path, not another feed.</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <a href="/features/agent-workbench" className="group rounded-2xl border border-[#c8fa78]/25 bg-[#151d12] p-5 transition hover:-translate-y-1 hover:border-[#c8fa78]/60"><Bot className="h-5 w-5 text-[#c8fa78]"/><p className="mt-7 text-[9px] font-bold uppercase tracking-[0.17em] text-[#91a083]">01 / Think</p><h3 className="mt-2 text-[17px] font-semibold tracking-tight">Career agent</h3><p className="mt-2 min-h-10 text-[11px] leading-5 text-[#929d8b]">Plan, ask questions and get structured guidance.</p><span className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[#d5ff98]">Open workspace <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-1"/></span></a>
          <a href="/features/mock-interview" className="group rounded-2xl border border-white/[0.09] bg-[#111611] p-5 transition hover:-translate-y-1 hover:border-white/25"><BrainCircuit className="h-5 w-5 text-[#c8fa78]"/><p className="mt-7 text-[9px] font-bold uppercase tracking-[0.17em] text-[#91a083]">02 / Practise</p><h3 className="mt-2 text-[17px] font-semibold tracking-tight">Interview studio</h3><p className="mt-2 min-h-10 text-[11px] leading-5 text-[#929d8b]">Prepare for real interview formats, one round at a time.</p><span className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[#d5ff98]">Open workspace <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-1"/></span></a>
          <a href="/features/oa-arena" className="group rounded-2xl border border-white/[0.09] bg-[#111611] p-5 transition hover:-translate-y-1 hover:border-white/25"><Code2 className="h-5 w-5 text-[#c8fa78]"/><p className="mt-7 text-[9px] font-bold uppercase tracking-[0.17em] text-[#91a083]">03 / Build</p><h3 className="mt-2 text-[17px] font-semibold tracking-tight">Coding arena</h3><p className="mt-2 min-h-10 text-[11px] leading-5 text-[#929d8b]">Develop problem-solving habits through practice.</p><span className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[#d5ff98]">Open workspace <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-1"/></span></a>
          <a href="/features/company-intelligence" className="group rounded-2xl border border-white/[0.09] bg-[#111611] p-5 transition hover:-translate-y-1 hover:border-white/25"><BriefcaseBusiness className="h-5 w-5 text-[#c8fa78]"/><p className="mt-7 text-[9px] font-bold uppercase tracking-[0.17em] text-[#91a083]">04 / Research</p><h3 className="mt-2 text-[17px] font-semibold tracking-tight">Company intel</h3><p className="mt-2 min-h-10 text-[11px] leading-5 text-[#929d8b]">Explore roles, hiring context and company research.</p><span className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[#d5ff98]">Open workspace <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-1"/></span></a>
        </div>
      </section>

      <section className="mb-16">
        <div className="mb-7"><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#c8fa78]">Explore by outcome</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">The skill library</h2><p className="mt-2 text-[12px] text-[#879381]">Choose the kind of progress you want to make today.</p></div>
        <div className="space-y-8">
          {paths.map((path) => <div key={path.number} className="grid gap-4 border-t border-white/[0.09] pt-5 lg:grid-cols-[190px_minmax(0,1fr)]"><div><span className="text-[10px] font-bold tracking-[0.15em] text-[#c8fa78]">{path.number} / PATH</span><h3 className="mt-2 text-lg font-semibold tracking-[-0.03em]">{path.title}</h3><p className="mt-2 max-w-[220px] text-[11px] leading-5 text-[#83907d]">{path.description}</p></div><div className="grid gap-2 md:grid-cols-3">{path.items.map((item) => { const Icon = item.icon; return <a key={item.href} href={item.href} className="group flex min-h-[112px] items-start gap-3 rounded-xl border border-white/[0.07] bg-[#101510] p-4 transition hover:border-[#c8fa78]/35 hover:bg-[#151d12]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.045] text-[#c8fa78]"><Icon className="h-4 w-4"/></span><span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold text-[#e8ece2]">{item.title}</span><span className="mt-1.5 block text-[10px] leading-5 text-[#83907d]">{item.detail}</span></span><ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#66715f] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#c8fa78]"/></a>; })}</div></div>)}
        </div>
      </section>

      <section className="mb-12 rounded-2xl border border-white/[0.08] bg-[#111711] p-5 sm:p-7"><div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c8fa78]/10 text-[#c8fa78]"><GraduationCap className="h-4 w-4"/></span><div><h2 className="text-[15px] font-semibold">Your career goals</h2><p className="mt-1 text-[11px] text-[#879381]">Keep your target role and preparation plan in one place.</p></div></div><CareerGoalsPanel/></section>
      <footer className="flex flex-col gap-2 border-t border-white/[0.08] pt-5 text-[10px] text-[#687463] sm:flex-row sm:items-center sm:justify-between"><span>APEX · Learn it. Practise it. Prove it.</span><span>Built for focused career preparation.</span></footer>
    </section>
  </main>;
}

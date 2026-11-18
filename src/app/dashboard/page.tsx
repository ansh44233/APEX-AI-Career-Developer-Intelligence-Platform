import { AccountControl } from "@/components/account-control";
import { CareerGoalsPanel } from "@/components/career-goals-panel";
import { PracticeHistoryPanel } from "@/components/practice-history-panel";
import { SkillAssessmentsPanel } from "@/components/skill-assessments-panel";
import { ProgressAnalyticsPanel } from "@/components/progress-analytics-panel";
import { TopicIntelligencePanel } from "@/components/topic-intelligence-panel";
import { AdaptiveLearningPanel } from "@/components/adaptive-learning-panel";
import { RoleCoveragePanel } from "@/components/role-coverage-panel";
import { PreparationRoadmapPanel } from "@/components/preparation-roadmap-panel";
import { CareerIntelligenceGraphPanel } from "@/components/career-intelligence-graph-panel";
import { CareerPipelinePanel } from "@/components/career-pipeline-panel";
import { CareerMemoryPanel } from "@/components/career-memory-panel";
import {
  ArrowRight, ArrowUpRight, BookOpen, BrainCircuit, BriefcaseBusiness,
  CalendarClock, ChartNoAxesCombined, Code2, FileSearch, Gauge, Layers3,
  LayoutDashboard, MessageSquareText, Search, ShieldCheck, Sparkles, Target, Zap,
} from "lucide-react";

const primaryModules = [
  { title: "Question bank", description: "Role-based interview prompts, topic tracks, hints and rubrics.", icon: BookOpen, href: "/features/question-bank", tag: "LEARN" },
  { title: "Mock interview", description: "Practise behavioural, technical and system-design rounds.", icon: BrainCircuit, href: "/features/mock-interview", tag: "PRACTISE" },
  { title: "Coding arena", description: "Build problem-solving fluency with focused assessments.", icon: Code2, href: "/features/oa-arena", tag: "ASSESS" },
  { title: "Company intelligence", description: "Explore source-linked research and role preparation.", icon: BriefcaseBusiness, href: "/features/company-intelligence", tag: "RESEARCH" },
];

const careerModules = [
  { title: "Job intelligence", description: "Map job descriptions to your preparation priorities.", icon: Search, href: "/features/job-intelligence" },
  { title: "Application follow-ups", description: "Keep interviews, deadlines and next actions visible.", icon: CalendarClock, href: "/features/application-follow-ups" },
  { title: "Resume intelligence", description: "Review your resume against a target role.", icon: FileSearch, href: "/features/resume-intelligence" },
  { title: "System design studio", description: "Practise architecture, constraints and trade-offs.", icon: Layers3, href: "/features/system-design" },
  { title: "Readiness engine", description: "Review self-assessed skills and learning priorities.", icon: Gauge, href: "/features/readiness-engine" },
  { title: "Project defense", description: "Explain project decisions and technical ownership.", icon: ShieldCheck, href: "/features/project-defense" },
  { title: "Interview experiences", description: "Read moderated first-hand community reports.", icon: MessageSquareText, href: "/features/interview-experiences" },
  { title: "Career command center", description: "Connect goals, applications and preparation.", icon: ChartNoAxesCombined, href: "/features/career-command-center" },
];

function ModuleCard({ item, featured = false }: { item: (typeof primaryModules)[number] | (typeof careerModules)[number]; featured?: boolean }) {
  const Icon = item.icon;
  return <a href={item.href} className={`group rounded-2xl border border-white/[0.08] bg-[#10130e] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#c6ff3d]/30 hover:bg-[#151a10] focus:outline-none focus:ring-2 focus:ring-[#c6ff3d]/60 ${featured ? "min-h-48" : "min-h-40"}`}>
    <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl border border-[#c6ff3d]/10 bg-[#c6ff3d]/[0.06] text-[#d8ff83]"><Icon className="h-5 w-5"/></span><span className="text-[9px] font-semibold tracking-[0.16em] text-zinc-600">{item.tag ?? "EXPLORE"}</span></div>
    <h3 className="mt-5 text-sm font-semibold text-white">{item.title}</h3><p className="mt-2 text-xs leading-5 text-zinc-500">{item.description}</p>
    <span className="mt-4 inline-flex items-center text-xs font-semibold text-[#c6ff3d]">Open module <ArrowUpRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5"/></span>
  </a>;
}

export default function Dashboard() {
  return <main className="min-h-screen bg-[#080a08] text-white lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="hidden border-r border-white/[0.07] bg-[#0b0e09] px-5 py-7 lg:flex lg:flex-col">
      <a href="/" className="mb-12 flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c6ff3d] text-sm font-black text-[#0b0d08]">A</span><span className="text-lg font-bold tracking-[0.16em]">APEX<span className="text-[#c6ff3d]">.</span></span></a>
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Workspace</p>
      <nav className="space-y-1">
        <a className="flex items-center gap-3 rounded-xl border border-[#c6ff3d]/15 bg-[#c6ff3d]/[0.07] px-3 py-2.5 text-sm font-medium text-[#d8ff83]" href="/dashboard"><LayoutDashboard className="h-4 w-4"/> Overview</a>
        <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="/features/question-bank"><BookOpen className="h-4 w-4"/> Question bank</a>
        <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="/features/mock-interview"><BrainCircuit className="h-4 w-4"/> Mock interview</a>
        <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="/features/oa-arena"><Code2 className="h-4 w-4"/> Coding arena</a>
        <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="/features/company-intelligence"><BriefcaseBusiness className="h-4 w-4"/> Company intel</a>
        <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="/features/career-command-center"><Target className="h-4 w-4"/> Command center</a>
      </nav>
      <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#c6ff3d]/10 text-[#c6ff3d]"><Sparkles className="h-4 w-4"/></div><p className="text-sm font-semibold">Your next step, clearly.</p><p className="mt-1 text-xs leading-5 text-zinc-500">Choose a track, practise, then review what changed.</p></div>
      <a href="/features/career-command-center" className="mt-5 flex items-center gap-3 px-3 text-sm text-zinc-500 hover:text-white"><Target className="h-4 w-4"/> Career command center</a>
    </aside>

    <section className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <header className="mb-10 flex items-center justify-between gap-4"><a href="/" className="flex items-center gap-3 lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#c6ff3d] font-black text-[#0b0d08]">A</span><span className="font-bold tracking-[0.16em]">APEX<span className="text-[#c6ff3d]">.</span></span></a><div className="hidden lg:block"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c6ff3d]">YOUR WORKSPACE</p><p className="mt-1 text-sm text-zinc-400">Overview <span className="text-zinc-700">/</span> Today</p></div><div className="ml-auto flex items-center gap-3"><a href="/features/question-bank" aria-label="Search questions" className="rounded-xl border border-white/[0.08] p-2.5 text-zinc-400 hover:bg-white/[0.05]"><Search className="h-4 w-4"/></a><AccountControl/></div></header>

      <section className="mb-9 overflow-hidden rounded-[28px] border border-[#c6ff3d]/15 bg-[radial-gradient(ellipse_at_85%_10%,rgba(198,255,61,0.13),transparent_38%),linear-gradient(125deg,#151a10,#0d100c_65%)] p-6 sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[#d8ff83]"><Sparkles className="h-4 w-4"/> YOUR CAREER, IN FOCUS</p><h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">Make every practice session <span className="text-[#c6ff3d]">count.</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">Your preparation workspace for interviews, coding, company research and career decisions. Start with one useful next action.</p></div><div className="flex flex-wrap gap-2"><a href="/features/mock-interview" className="inline-flex items-center gap-2 rounded-xl bg-[#c6ff3d] px-4 py-3 text-sm font-bold text-[#0b0d08] transition hover:bg-[#d8ff83]"><Zap className="h-4 w-4"/> Start interview</a><a href="/features/question-bank" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"><BookOpen className="h-4 w-4"/> Browse questions</a></div></div>
        <div className="mt-8 grid gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-3"><div><p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-600">01 / LEARN</p><p className="mt-1 text-sm font-medium">Explore question tracks</p></div><div><p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-600">02 / PRACTISE</p><p className="mt-1 text-sm font-medium">Save your interview answers</p></div><div><p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-600">03 / IMPROVE</p><p className="mt-1 text-sm font-medium">Review your progress signals</p></div></div>
      </section>

      <div className="mb-8"><CareerMemoryPanel/></div>
      <div className="mb-8"><CareerGoalsPanel/></div>
      <section className="mb-10"><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c6ff3d]">START HERE</p><h2 className="mt-1 text-xl font-semibold">Your practice toolkit</h2></div><span className="text-xs text-zinc-600">Four core workflows</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{primaryModules.map(item=><ModuleCard key={item.title} item={item} featured/>)}</div></section>

      <section className="mb-10"><div className="mb-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c6ff3d]">BUILD YOUR EDGE</p><h2 className="mt-1 text-xl font-semibold">Career tools</h2><p className="mt-1 text-xs text-zinc-500">Bring your preparation, applications and decisions together.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{careerModules.map(item=><ModuleCard key={item.title} item={item}/>)}</div></section>

      <section className="mb-10 grid gap-4 xl:grid-cols-2"><div className="rounded-2xl border border-white/[0.07] bg-[#10130e] p-5"><div className="mb-4 flex items-center gap-2 text-sm font-semibold"><ChartNoAxesCombined className="h-4 w-4 text-[#c6ff3d]"/> Practice history</div><PracticeHistoryPanel/></div><div className="rounded-2xl border border-white/[0.07] bg-[#10130e] p-5"><div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Target className="h-4 w-4 text-[#c6ff3d]"/> Skill assessments</div><SkillAssessmentsPanel/></div></section>

      <details className="mb-10 rounded-2xl border border-white/[0.07] bg-[#0d100c] p-5"><summary className="cursor-pointer list-none text-sm font-semibold text-zinc-200">Open advanced analytics and planning <span className="ml-2 text-xs font-normal text-zinc-600">Optional · expands when needed</span></summary><div className="mt-6 space-y-7"><ProgressAnalyticsPanel/><TopicIntelligencePanel/><AdaptiveLearningPanel/><RoleCoveragePanel/><CareerIntelligenceGraphPanel/><CareerPipelinePanel/><PreparationRoadmapPanel/></div></details>
      <footer className="flex flex-col gap-2 border-t border-white/[0.07] pt-6 text-[11px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between"><span>APEX · Your work, your progress, your next move.</span><a href="/features/career-command-center" className="text-[#c6ff3d] hover:text-white">Open command center <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a></footer>
    </section>
  </main>;
}

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

import {
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronRight,
  Code2,
  Flame,
  LayoutDashboard,
  Layers3,
  FileSearch,
  Gauge,
  MessageSquareText,
  Mic2,
  Search,
  Scale,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

// Keep the first dashboard modules in one place so the navigation and cards can share them later.\nconst modules = [
  { title: "Interview Lab", description: "Practise technical, behavioural and HR interviews.", icon: MessageSquareText, tag: "PRACTISE", href: "/features/interview-lab" },
  { title: "Interview Question Bank", description: "Search original APEX prompts with company context and role-based topic tracks.", icon: BookOpen, tag: "LEARN", href: "/features/question-bank" },
  { title: "Interview Experiences", description: "Browse approved first-hand community reports with source and review labels, or submit your own for moderation.", icon: MessageSquareText, tag: "COMMUNITY", href: "/features/interview-experiences" },
  { title: "Coding Arena", description: "Work through coding assessment problems and review your approach.", icon: Code2, tag: "ASSESS", href: "/features/oa-arena" },
  { title: "Company Intel", description: "Explore a searchable company directory, official career links and role-specific preparation blueprints.", icon: BriefcaseBusiness, tag: "RESEARCH", href: "/features/company-intelligence" },
  { title: "Resume Intelligence", description: "Compare resume content with a target role's keywords.", icon: FileSearch, tag: "IMPROVE", href: "/features/resume-intelligence" },
  { title: "System Design Studio", description: "Practise architecture prompts, components and trade-offs.", icon: Layers3, tag: "DESIGN", href: "/features/system-design" },
  { title: "Readiness Engine", description: "Review self-assessed skills and identify preparation priorities.", icon: Gauge, tag: "GROW", href: "/features/readiness-engine" },
  { title: "Project Defense", description: "Practise explaining project architecture and technical decisions.", icon: ShieldCheck, tag: "EXPLAIN", href: "/features/project-defense" },
  { title: "Offer Intelligence", description: "Compare compensation, growth, role fit and work preferences.", icon: Scale, tag: "COMPARE", href: "/features/offer-intelligence" },
  { title: "APEX Skills", description: "Install portable coaching and developer workflows in compatible AI agents.", icon: Bot, tag: "EXTEND", href: "/features/apex-skills" },
  { title: "Agent Workbench", description: "Use APEX skills in authenticated, single-turn AI coaching sessions.", icon: Sparkles, tag: "AI BETA", href: "/features/agent-workbench" },
];

// These entries are demo content until authentication and activity storage are connected.\nconst activity = [
  { label: "Technical interview", detail: "Arrays & problem solving", score: "82%", date: "Today" },
  { label: "Coding assessment", detail: "Strings · 45 minutes", score: "76%", date: "Yesterday" },
  { label: "Resume analysis", detail: "Software Engineer role", score: "—", date: "Nov 15" },
];

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">{eyebrow}</p>
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      </div>
      {action ? (
        <button className="text-xs text-zinc-400 transition hover:text-white">
          {action} <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/[0.07] bg-black/20 px-5 py-7 lg:flex lg:flex-col">
        <a href="#" className="mb-12 flex items-center gap-3 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500 text-sm font-black text-white shadow-lg shadow-violet-950/40">A</span>
          <span className="text-lg font-bold tracking-[0.16em] text-white">APEX<span className="text-violet-400">.</span></span>
        </a>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Workspace</p>
        <nav className="space-y-1">
          <a className="flex items-center gap-3 rounded-xl border border-violet-400/15 bg-violet-400/10 px-3 py-2.5 text-sm font-medium text-violet-200" href="#">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="#">
            <Target className="h-4 w-4" /> Preparation
          </a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="#">
            <BrainCircuit className="h-4 w-4" /> AI Interview Lab
          </a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="#">
            <Code2 className="h-4 w-4" /> Coding Arena
          </a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="/features/company-intelligence">
            <BriefcaseBusiness className="h-4 w-4" /> Company Intel
          </a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="/features/interview-experiences">
            <MessageSquareText className="h-4 w-4" /> Experiences
          </a>
          <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-white" href="#">
            <ChartNoAxesCombined className="h-4 w-4" /> Performance
          </a>
        </nav>

        <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300"><Sparkles className="h-4 w-4" /></div>
          <p className="text-sm font-semibold text-white">Your next level starts here.</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Build consistency. Track progress. Get career-ready.</p>
        </div>
        <button className="mt-5 flex items-center gap-3 px-3 text-sm text-zinc-500 hover:text-white">
          <Settings2 className="h-4 w-4" /> Settings
        </button>
      </aside>

      <section className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500 font-black">A</span>
            <span className="font-bold tracking-[0.16em]">APEX<span className="text-violet-400">.</span></span>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs text-zinc-500">Wednesday, November 18, 2026</p>
            <p className="mt-1 text-sm text-zinc-300">Your workspace <span className="text-zinc-600">/</span> Overview</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button aria-label="Search" className="rounded-xl border border-white/[0.08] p-2.5 text-zinc-400 hover:bg-white/[0.05]"><Search className="h-4 w-4" /></button>
            <AccountControl />
          </div>
        </header>

        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-medium text-violet-300"><Sparkles className="h-3.5 w-3.5" /> YOUR CAREER, IN FOCUS</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Build your next <span className="text-violet-300">breakthrough.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">One workspace to practise, measure your skills and move forward with purpose.</p>
          </div>
          <a href="/features/interview-lab" className="inline-flex w-fit items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400">
            <Zap className="h-4 w-4" /> Start a session <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mb-8"><CareerGoalsPanel /></div>

        <div className="mb-8"><PracticeHistoryPanel /></div>

        <div className="mb-8"><SkillAssessmentsPanel /></div>

        <div className="mb-8"><ProgressAnalyticsPanel /></div>

        <div className="mb-8"><TopicIntelligencePanel /></div>

        <div className="mb-8"><AdaptiveLearningPanel /></div>

        <div className="mb-8"><RoleCoveragePanel /></div>

        <div className="mb-8"><CareerIntelligenceGraphPanel /></div>

        <div className="mb-8"><PreparationRoadmapPanel /></div>

        <div className="mb-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Preparation progress", value: "68%", note: "Your sample profile", icon: Target, change: "+8% this week" },
            { label: "Practice sessions", value: "24", note: "Across all modules", icon: Flame, change: "4 this week" },
            { label: "Average score", value: "81/100", note: "Based on demo activity", icon: Trophy, change: "+5 points" },
            { label: "Skills in progress", value: "06", note: "Keep building consistency", icon: BrainCircuit, change: "2 improving" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs text-zinc-400">{stat.label}</span>
                <stat.icon className="h-4 w-4 text-violet-300" />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-600">{stat.note}</span>
                <span className="text-[10px] text-emerald-400">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.85fr)]">
          <div>
            <SectionHeading eyebrow="Explore the platform" title="Your preparation toolkit" action="View all modules" />
            <div className="grid gap-3 sm:grid-cols-2">
              {modules.map((module) => (
                <a href={module.href} key={module.title} className="group block rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-violet-400/60">
                  <div className="mb-6 flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-violet-200"><module.icon className="h-5 w-5" /></span>
                    <span className="text-[9px] font-semibold tracking-[0.16em] text-zinc-600">{module.tag}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{module.title}</h3>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-zinc-500">{module.description}</p>
                  <span className="mt-4 inline-flex items-center text-xs font-medium text-violet-300 transition group-hover:text-violet-200">Open experience <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></span>
                </a>
              ))}
            </div>

            <div className="mt-8">
              <SectionHeading eyebrow="Your journey" title="Recent activity" action="Full history" />
              <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                {activity.map((item, index) => (
                  <div key={item.label} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5 ${index ? "border-t border-white/[0.06]" : ""}`}>
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] text-zinc-400"><ShieldCheck className="h-4 w-4" /></span>
                      <div><p className="text-xs font-medium text-zinc-200">{item.label}</p><p className="mt-1 text-[11px] text-zinc-600">{item.detail}</p></div>
                    </div>
                    <div className="ml-auto flex items-center gap-5 text-right"><span className="text-xs font-semibold text-zinc-300">{item.score}</span><span className="w-16 text-[11px] text-zinc-600">{item.date}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/10 to-transparent p-5">
              <div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold text-violet-200">WEEKLY FOCUS</span><Mic2 className="h-4 w-4 text-violet-300" /></div>
              <h3 className="text-xl font-semibold tracking-tight text-white">Explain your thinking.</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-400">Strong developers don't just solve problems. They communicate the reasoning behind their decisions.</p>
              <div className="mt-5 flex items-center justify-between text-[11px]"><span className="text-zinc-500">Suggested practice</span><span className="text-violet-200">15 minutes</span></div>
              <button className="mt-4 w-full rounded-xl border border-violet-300/20 bg-violet-400/10 py-2.5 text-xs font-semibold text-violet-100 hover:bg-violet-400/15">Explore communication practice <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <SectionHeading eyebrow="Skill snapshot" title="Your current focus" />
              {[
                { name: "Problem solving", value: 82 },
                { name: "Communication", value: 64 },
                { name: "System design", value: 48 },
                { name: "Core CS", value: 73 },
              ].map((skill) => (
                <div key={skill.name} className="mb-4 last:mb-0">
                  <div className="mb-2 flex justify-between text-[11px]"><span className="text-zinc-400">{skill.name}</span><span className="text-zinc-300">{skill.value}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-violet-400" style={{ width: `${skill.value}%` }} /></div>
                </div>
              ))}
              <p className="mt-4 text-[10px] leading-4 text-zinc-600">Illustrative dashboard data. Connect an account to track real activity.</p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200"><Sparkles className="h-4 w-4 text-violet-300" /> APEX intelligence</div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">APEX now turns your latest self-assessments and saved practice recency into transparent next-step suggestions. These are rule-based signals, not AI evaluations or skill scores.</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-300/10 bg-amber-300/[0.05] px-2.5 py-1.5 text-[10px] text-amber-200/80">Rule-based · Database required</div>
            </div>
          </aside>
        </div>

        <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-white/[0.07] pt-5 text-[10px] text-zinc-600 sm:flex-row">
          <span>APEX · AI Career & Developer Intelligence</span>
          <span>Early product foundation · Sample data only</span>
        </footer>
      </section>
    </main>
  );
}
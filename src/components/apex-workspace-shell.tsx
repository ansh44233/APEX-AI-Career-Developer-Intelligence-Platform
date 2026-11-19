"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, ArrowUpRight, BookOpen, Bot, BrainCircuit, BriefcaseBusiness,
  Code2, Command, Compass, GraduationCap, LayoutDashboard, Menu,
  Moon, Search, ShieldCheck, Sun, Target, X, Sparkles,
} from "lucide-react";
import { AccountControl } from "@/components/account-control";

const groups = [
  { label: "COMMAND", items: [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Career missions", href: "/features/career-command-center", icon: Target },
    { label: "AI mentor", href: "/features/agent-workbench", icon: Bot },
  ]},
  { label: "TRAINING SIMULATORS", items: [
    { label: "Interview simulator", href: "/features/mock-interview", icon: BrainCircuit },
    { label: "Engineering lab", href: "/features/oa-arena", icon: Code2 },
    { label: "Architecture lab", href: "/features/system-design", icon: Command },
    { label: "Project defence", href: "/features/project-defense", icon: ShieldCheck },
  ]},
  { label: "CAREER INTELLIGENCE", items: [
    { label: "Company intelligence", href: "/features/company-intelligence", icon: BriefcaseBusiness },
    { label: "Job tracker", href: "/features/job-intelligence", icon: Search },
    { label: "Resume studio", href: "/features/resume-intelligence", icon: BookOpen },
    { label: "Question bank", href: "/features/question-bank", icon: GraduationCap },
  ]},
];

export function ApexWorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("apex-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.apexTheme = theme;
    window.localStorage.setItem("apex-theme", theme);
  }, [theme]);

  const sidebar = <div className="flex h-full flex-col">
    <Link href="/dashboard" className="flex items-center gap-3 px-5 py-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c5f36a] text-[#11170a]"><svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true"><path d="M7 29 18 8q2-4 4 0l11 21h-8l-5-10-5 10H7Z" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round"/><path d="m10 26 18-9" stroke="#f4a261" strokeWidth="2.7" strokeLinecap="round"/></svg></span>
      <span><span className="block text-lg font-black tracking-[-.06em]">APEX<span className="text-[#c5f36a]">.</span></span><span className="block text-[9px] font-semibold tracking-[.16em] text-[var(--muted)]">CAREER, BUILT BY YOU</span></span>
    </Link>
    <div className="px-3">
      {groups.map(group => <div key={group.label} className="mb-7">
        <p className="mb-2 px-3 text-[9px] font-bold tracking-[.19em] text-[var(--muted)]">{group.label}</p>
        <nav className="space-y-1">{group.items.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12px] font-medium transition ${active ? "bg-[#c5f36a]/10 text-[#c5f36a]" : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"}`}>
            <Icon className="h-4 w-4"/>{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c5f36a]"/>}
          </Link>;
        })}</nav>
      </div>)}
    </div>
    <div className="mt-auto px-6 py-5"><p className="text-[9px] font-semibold tracking-[.14em] text-[var(--muted)]">APEX WORKSPACE</p><p className="mt-1 text-[10px] text-[var(--muted)]">Make progress you can show.</p></div>
  </div>;

  return <div className="apex-app min-h-screen bg-[var(--app-bg)] text-[var(--text)]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-[var(--line)] bg-[var(--sidebar)] lg:block">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/60"/><aside className="absolute inset-y-0 left-0 w-[285px] border-r border-[var(--line)] bg-[var(--sidebar)]">{sidebar}<button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-lg p-2"><X className="h-4 w-4"/></button></aside></div>}
    <div className="lg:pl-[250px]">
      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[var(--line)] bg-[var(--header)] px-4 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="rounded-lg border border-[var(--line)] p-2 lg:hidden"><Menu className="h-4 w-4"/></button><div className="hidden text-[10px] font-semibold tracking-[.16em] text-[var(--muted)] sm:block">CAREER WORKSPACE <span className="px-2 opacity-40">/</span> {pathname === "/dashboard" ? "COMMAND CENTRE" : "WORKSPACE"}</div><span className="text-sm font-black tracking-tight lg:hidden">APEX<span className="text-[#c5f36a]">.</span></span></div>
        <div className="flex items-center gap-2"><span className="hidden items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-2 text-[10px] text-[var(--muted)] md:inline-flex"><Activity className="h-3 w-3 text-emerald-500"/> Workspace</span><button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} className="rounded-xl border border-[var(--line)] p-2.5 text-[var(--muted)] transition hover:text-[var(--text)]">{theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}</button><AccountControl/></div>
      </header>
      <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-[1600px] px-4 py-7 sm:px-7 lg:px-10 lg:py-9">{children}</main>
    </div>
  </div>;
}

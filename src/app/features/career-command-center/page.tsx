import { CareerCommandCenter } from "@/components/career-command-center";
import { ArrowLeft } from "lucide-react";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

export default function CareerCommandCenterPage() {
  return <ApexWorkspaceShell><main className="min-h-screen bg-[#09090d] px-5 py-8 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-10 flex items-center justify-between">
        <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Dashboard</a>
        <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
        <div className="flex items-center gap-4"><div className="flex items-center gap-3"><a href="/features/career-os" className="text-xs text-cyan-200 hover:text-cyan-100">Career OS ↗</a><a href="/features/career-twin" className="text-xs text-violet-300 hover:text-violet-200">Career Twin ↗</a><a href="/features/career-simulation" className="text-xs text-violet-300 hover:text-violet-200">Career Simulation ↗</a></div><a href="/features/agent-workbench?skill=career-copilot" className="text-xs text-violet-300 hover:text-violet-200">Career Copilot ↗</a></div>
      </header>
      <div className="mb-8 max-w-3xl"><p className="text-xs font-semibold tracking-[0.2em] text-violet-300">APEX INTELLIGENCE / PHASE 45</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Career Command<br/><span className="text-violet-300">Center.</span></h1><p className="mt-4 text-sm leading-6 text-zinc-400">Your connected workspace for career direction, employer research, skill development, daily execution and progress review.</p></div>
      <CareerCommandCenter/>
    </div>
  </main></ApexWorkspaceShell>;
}

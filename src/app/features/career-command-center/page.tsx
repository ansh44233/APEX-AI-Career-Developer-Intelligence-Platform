import { CareerCommandCenter } from "@/components/career-command-center";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

export default function CareerCommandCenterPage() {
  return <ApexWorkspaceShell><div className="min-h-screen bg-[var(--app-bg)] px-5 py-8 text-[var(--text)] sm:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 max-w-3xl"><p className="text-xs font-semibold tracking-[0.2em] text-[#c5f36a]">APEX INTELLIGENCE / PHASE 45</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Career Command<br/><span className="text-[#c5f36a]">Center.</span></h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">Your connected workspace for career direction, employer research, skill development, daily execution and progress review.</p></div>
      <CareerCommandCenter/>
    </div>
  </main></ApexWorkspaceShell>;
}

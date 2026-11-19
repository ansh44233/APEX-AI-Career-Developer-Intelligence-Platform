import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";
import { CareerPipelinePanel } from "@/components/career-pipeline-panel";
import { ArrowLeft } from "lucide-react";

export default function CareerPipelinePage() {
  return <ApexWorkspaceShell><div className="min-h-screen text-[var(--text)]">
    <div className="mx-auto max-w-7xl">
      <div className="mb-7 max-w-3xl"><p className="text-xs font-semibold tracking-[0.2em] text-[#c5f36a]">APEX INTELLIGENCE / PHASE 26</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Your career pipeline,<br/><span className="text-[#c5f36a]">connected.</span></h1><p className="mt-4 text-sm leading-6 text-[var(--muted)]">See where your applications stand, what needs attention next and how much preparation you have marked complete.</p></div>
      <CareerPipelinePanel/>
    </div>
  </div></ApexWorkspaceShell>;
}

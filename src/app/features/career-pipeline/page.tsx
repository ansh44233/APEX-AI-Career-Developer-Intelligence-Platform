import { CareerPipelinePanel } from "@/components/career-pipeline-panel";
import { ArrowLeft } from "lucide-react";

export default function CareerPipelinePage() {
  return <main className="min-h-screen bg-[#09090d] px-5 py-8 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-10 flex items-center justify-between">
        <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Dashboard</a>
        <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
        <a href="/features/job-intelligence" className="text-xs text-zinc-400 hover:text-white">Job Intelligence</a>
      </header>
      <div className="mb-7 max-w-3xl"><p className="text-xs font-semibold tracking-[0.2em] text-violet-300">APEX INTELLIGENCE / PHASE 26</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Your career pipeline,<br/><span className="text-violet-300">connected.</span></h1><p className="mt-4 text-sm leading-6 text-zinc-400">See where your applications stand, what needs attention next and how much preparation you have marked complete.</p></div>
      <CareerPipelinePanel/>
    </div>
  </main>;
}

"use client";

import { ExternalLink, ShieldCheck, Users, BookOpen, Info } from "lucide-react";
import { companyEvidencePolicy, getCompanyEvidenceSources } from "@/lib/company-evidence";

export function CompanyEvidencePanel({ company, role }: { company: string; role: string }) {
  const sources = getCompanyEvidenceSources(company);
  return <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300"/><h3 className="font-semibold">Evidence & source trail</h3></div>
    <p className="mt-2 text-xs leading-5 text-zinc-500">Sources are grouped by who published them. A link is a starting point, not proof that a role or interview process is current.</p>
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><ShieldCheck className="h-4 w-4"/> Employer-published sources</p>
        {sources.map(source => <div key={source.id} className="mt-3 border-t border-white/[0.06] pt-3">
          <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-zinc-200 underline decoration-zinc-600 underline-offset-4">{source.title} <ExternalLink className="ml-1 inline h-3 w-3"/></a>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">{source.scope}</p>
          <p className="mt-1 text-[10px] text-zinc-600">Destination link only · last checked: not recorded</p>
        </div>)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-sky-300/10 bg-sky-300/[0.035] p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-sky-200"><Users className="h-4 w-4"/> Community reports</p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">{companyEvidencePolicy.community}</p>
          <a href={"/features/interview-experiences?company=" + encodeURIComponent(company) + "&role=" + encodeURIComponent(role)} className="mt-3 inline-flex text-xs text-sky-200 underline underline-offset-4">Browse approved reports <ExternalLink className="ml-1 h-3 w-3"/></a>
        </div>
        <div className="rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-violet-200"><BookOpen className="h-4 w-4"/> APEX-authored material</p>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">{companyEvidencePolicy.apex}</p>
          <a href={"/features/question-bank?company=" + encodeURIComponent(company) + "&role=" + encodeURIComponent(role)} className="mt-3 inline-flex text-xs text-violet-200 underline underline-offset-4">Open role practice bank <ExternalLink className="ml-1 h-3 w-3"/></a>
        </div>
      </div>
    </div>
    <p className="mt-4 flex gap-2 text-[10px] leading-5 text-zinc-600"><Info className="mt-0.5 h-3 w-3 shrink-0"/> No live vacancy feed, interview-round extraction, freshness monitor or question-frequency dataset is connected yet.</p>
  </section>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, ExternalLink, Lightbulb, ShieldCheck } from "lucide-react";
import {
  getCompanyResearchProfile,
  getCompanyResearchSource,
  type CompanyResearchArea,
} from "@/lib/company-research-catalog";

const areas: Array<{ id: CompanyResearchArea; label: string }> = [
  { id: "products-services", label: "Products & services" },
  { id: "technology-focus", label: "Technology focus" },
  { id: "engineering-practices", label: "Engineering practices" },
  { id: "competitors-market", label: "Market context" },
];

type ApprovedResearchSnapshot = { sourceId: string; retrievedAt: string; contentHash: string; sourceUrl: string; pageTitle: string };

export function CompanyResearchProfilePanel({ company }: { company: string }) {
  const profile = useMemo(() => getCompanyResearchProfile(company), [company]);
  const [showAll, setShowAll] = useState(false);
  const [approvedSnapshots, setApprovedSnapshots] = useState<ApprovedResearchSnapshot[]>([]);
  const [snapshotsLoaded, setSnapshotsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setApprovedSnapshots([]);
    setSnapshotsLoaded(false);
    fetch("/api/company-intelligence/evidence?company=" + encodeURIComponent(company), { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Evidence unavailable")))
      .then((data) => {
        if (active) setApprovedSnapshots((data.captures ?? []).map((capture: ApprovedResearchSnapshot) => ({
          sourceId: capture.sourceId,
          retrievedAt: capture.retrievedAt,
          contentHash: capture.contentHash,
          sourceUrl: capture.sourceUrl,
          pageTitle: capture.pageTitle,
        })));
      })
      .catch(() => { if (active) setApprovedSnapshots([]); })
      .finally(() => { if (active) setSnapshotsLoaded(true); });
    return () => { active = false; };
  }, [company]);

  if (!profile) {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
        <div className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-violet-300"/><h3 className="font-semibold">Company research</h3></div>
        <p className="mt-3 text-xs leading-5 text-zinc-500">A sourced research profile has not been curated for {company} yet. APEX will not fill this gap with guessed company facts.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] text-violet-300"><BookOpenCheck className="h-4 w-4"/> COMPANY RESEARCH</p><h3 className="mt-2 text-lg font-semibold">{company}: sourced overview</h3></div>
        <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.05] px-2.5 py-1 text-[10px] text-emerald-200"><ShieldCheck className="mr-1 inline h-3 w-3"/> Curated source summaries</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-500">These manually curated summaries link to public company disclosures. A source URL alone is not a reviewed capture: the evidence status below distinguishes approved snapshots from links that still need inspection and moderation. Company-level products and platforms do not establish a specific team’s stack, practices or hiring requirements.</p>

      <div className="mt-5 space-y-3">
        {areas.map((area) => {
          const claims = profile.claims.filter((claim) => claim.area === area.id);
          const gap = profile.gaps.find((item) => item.area === area.id);
          return (
            <div key={area.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2"><h4 className="text-xs font-semibold text-zinc-200">{area.label}</h4><span className="text-[10px] text-zinc-600">{claims.length ? claims.length + " sourced" : "Not established"}</span></div>
              {claims.length > 0 ? <ul className="mt-3 space-y-3">{claims.map((claim) => {
                const source = getCompanyResearchSource(claim.sourceId);
                return <li key={claim.id} className="border-t border-white/[0.06] pt-3">
                  <p className="text-xs leading-5 text-zinc-300">{claim.statement}</p>
                  <p className="mt-1 text-[10px] leading-5 text-zinc-600">{claim.scopeNote}</p>
                  {source && <a href={source.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] text-violet-200 underline underline-offset-2">{source.publisher}: {source.title} <ExternalLink className="h-3 w-3"/></a>}
                  {source && <p className="mt-1 text-[9px] text-zinc-600">Catalogue checked {source.checkedAt}{source.publishedAt ? " · Published " + source.publishedAt : " · Publication date not stated"}</p>}
                  {source && (() => {
                    const snapshot = approvedSnapshots.filter((item) => item.sourceId === source.id).sort((a, b) => new Date(b.retrievedAt).getTime() - new Date(a.retrievedAt).getTime())[0];
                    return <p className="mt-1 text-[9px] leading-4 text-zinc-500">{!snapshotsLoaded ? "Checking approved snapshot status…" : snapshot ? <>Approved capture: {new Date(snapshot.retrievedAt).toLocaleDateString()} · SHA-256 {snapshot.contentHash.slice(0, 12)}…</> : "No moderator-approved snapshot yet · inspect this source in Evidence & source trail below"}</p>;
                  })()}
                </li>;
              })}</ul> : <p className="mt-2 text-[11px] leading-5 text-amber-200/70">{gap?.reason ?? "No approved evidence is available for this area yet."}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-violet-300/10 bg-violet-300/[0.035] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-violet-200"><Lightbulb className="h-4 w-4"/> APEX preparation interpretation</p>
        <p className="mt-1 text-[10px] text-zinc-500">Original APEX analysis—not an employer statement or interview rubric.</p>
        <ul className="mt-2 space-y-2">{profile.apexAnalysis.slice(0, showAll ? undefined : 1).map((item) => <li key={item} className="text-xs leading-5 text-zinc-300">{item}</li>)}</ul>
      </div>
      <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-3 text-[10px] font-medium text-zinc-400 underline underline-offset-4">{showAll ? "Show less" : "Show full APEX analysis"}</button>
    </section>
  );
}

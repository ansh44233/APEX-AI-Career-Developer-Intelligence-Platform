"use client";

import { useEffect, useState } from "react";
import { ExternalLink, ShieldCheck, Users, BookOpen, Info, Search, Loader2, Copy } from "lucide-react";
import { companyEvidencePolicy, getCompanyEvidenceSources } from "@/lib/company-evidence";

type ApprovedClaim = { id: string; company: string; role: string; claimType: string; claimText: string; supportingExcerpt: string; reviewedAt: string | null; capture: { sourceTitle: string; sourceUrl: string; retrievedAt: string; contentHash: string } };
type ApprovedCapture = { id: string; sourceId: string; sourceTitle: string; sourceUrl: string; retrievedAt: string; pageTitle: string; description: string; excerpt: string; contentHash: string };

function isHistoricalSnapshot(retrievedAt: string) {
  const timestamp = new Date(retrievedAt).getTime();
  return !Number.isFinite(timestamp) || Date.now() - timestamp > 365 * 24 * 60 * 60 * 1000;
}

type Capture = {
  id: string;
  source: { id: string; company: string; title: string; url: string };
  capturedAt: string;
  contentHash: string;
  httpStatus: number;
  extracted: { title: string; description: string; excerpt: string };
  reviewStatus: "pending" | "approved" | "rejected";
  persisted: true;
  notice: string;
};

export function CompanyEvidencePanel({ company, role }: { company: string; role: string }) {
  const sources = getCompanyEvidenceSources(company);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [approved, setApproved] = useState<ApprovedCapture[]>([]);
  const [claims, setClaims] = useState<ApprovedClaim[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/company-intelligence/evidence?company=" + encodeURIComponent(company), { cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Could not load approved evidence.")))
      .then(data => { if (active) setApproved(data.captures ?? []); })
      .catch(() => { if (active) setApproved([]); });
    return () => { active = false; };
  }, [company]);

  useEffect(() => {
    let active = true;
    fetch("/api/company-intelligence/claims?company=" + encodeURIComponent(company) + "&role=" + encodeURIComponent(role), { cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Could not load approved role claims.")))
      .then(data => { if (active) setClaims(data.claims ?? []); })
      .catch(() => { if (active) setClaims([]); });
    return () => { active = false; };
  }, [company, role]);

  async function inspectSource(sourceId: string) {
    setLoadingId(sourceId); setError(""); setCapture(null); setCopied(false);
    try {
      const response = await fetch("/api/company-intelligence/capture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not inspect this source.");
      setCapture(data as Capture);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not inspect this source.");
    } finally { setLoadingId(null); }
  }

  async function copyCapture() {
    if (!capture) return;
    const content = [
      "APEX SOURCE CAPTURE — UNREVIEWED",
      capture.source.company + " · " + capture.source.title,
      capture.source.url,
      "Captured: " + capture.capturedAt,
      "SHA-256: " + capture.contentHash,
      "",
      capture.extracted.title,
      capture.extracted.description,
      capture.extracted.excerpt,
      "",
      capture.notice,
    ].join("\n");
    try { await navigator.clipboard.writeText(content); setCopied(true); } catch { setCopied(false); }
  }

  return <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300"/><h3 className="font-semibold">Evidence & source trail</h3></div>
    <p className="mt-2 text-xs leading-5 text-zinc-500">Inspect a registered employer page to create a bounded, unreviewed preview. A link or page capture is not proof that a vacancy or interview process is current.</p>
    <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><ShieldCheck className="h-4 w-4"/> Employer-published sources</p>
        {sources.map(source => <div key={source.id} className="mt-3 border-t border-white/[0.06] pt-3">
          <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-zinc-200 underline decoration-zinc-600 underline-offset-4">{source.title} <ExternalLink className="ml-1 inline h-3 w-3"/></a>
          <p className="mt-1 text-[11px] leading-5 text-zinc-500">{source.scope}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-[10px] text-zinc-600">Last checked: not recorded</span>
            <button onClick={() => inspectSource(source.id)} disabled={loadingId !== null} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/15 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-200 disabled:opacity-50">
              {loadingId === source.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Search className="h-3 w-3"/>} Inspect page
            </button>
          </div>
        </div>)}
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-300/15 bg-rose-300/[0.04] p-3 text-xs text-rose-200">{error}</p>}
      {capture && <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-amber-200">Captured page · Unreviewed</p><span className="text-[10px] text-zinc-500">HTTP {capture.httpStatus}</span></div>
        <p className="mt-2 text-sm font-semibold text-zinc-200">{capture.extracted.title || capture.source.title}</p>
        {capture.extracted.description && <p className="mt-2 text-xs leading-5 text-zinc-400">{capture.extracted.description}</p>}
        <p className="mt-3 max-h-52 overflow-y-auto whitespace-normal text-xs leading-6 text-zinc-400">{capture.extracted.excerpt || "No page excerpt was extracted."}</p>
        <p className="mt-3 break-all text-[9px] text-zinc-600">Captured {new Date(capture.capturedAt).toLocaleString()} · SHA-256 {capture.contentHash}</p>
        <p className="mt-2 text-[10px] leading-5 text-amber-200/70">{capture.notice}</p>
        <button onClick={copyCapture} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-300"><Copy className="h-3 w-3"/>{copied ? "Copied capture" : "Copy evidence record"}</button>
      </div>}
      <a href="/features/moderation/company-evidence" className="inline-flex text-xs text-zinc-400 underline underline-offset-4">Open source evidence moderation queue</a>
      {claims.length > 0 && <div className="rounded-2xl border border-violet-300/15 bg-violet-300/[0.035] p-4"><p className="text-xs font-semibold text-violet-200">Approved claims for {role}</p><div className="mt-3 space-y-3">{claims.map(item => <div key={item.id} className="border-t border-white/[0.06] pt-3"><p className="text-xs font-medium text-zinc-200">{item.claimText}</p><p className="mt-1 text-[10px] text-violet-200/70">{item.claimType === "explicit_requirement" ? "Explicit requirement" : "Employer guidance"} · {isHistoricalSnapshot(item.capture.retrievedAt) ? "Historical source snapshot (over 12 months old)" : "Source snapshot within 12 months"}</p><blockquote className="mt-2 border-l border-violet-300/30 pl-3 text-[11px] leading-5 text-zinc-400">{item.supportingExcerpt}</blockquote><a href={item.capture.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[10px] text-violet-200 underline">{item.capture.sourceTitle} <ExternalLink className="ml-1 inline h-3 w-3"/></a></div>)}</div></div>}
      {approved.length > 0 && <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.035] p-4"><p className="text-xs font-semibold text-emerald-200">Moderator-reviewed source snapshots</p><div className="mt-3 space-y-3">{approved.map(item => <div key={item.id} className="border-t border-white/[0.06] pt-3"><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-zinc-200 underline underline-offset-4">{item.pageTitle || item.sourceTitle} <ExternalLink className="ml-1 inline h-3 w-3"/></a><p className="mt-1 text-[10px] text-zinc-500">Captured {new Date(item.retrievedAt).toLocaleString()} · reviewed snapshot · {isHistoricalSnapshot(item.retrievedAt) ? "Historical — over 12 months old" : "Within 12 months"}</p>{item.description && <p className="mt-2 text-[11px] leading-5 text-zinc-400">{item.description}</p>}<p className="mt-2 max-h-28 overflow-y-auto text-[11px] leading-5 text-zinc-500">{item.excerpt}</p><p className="mt-1 break-all text-[9px] text-zinc-600">SHA-256 {item.contentHash}</p></div>)}</div></div>}
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
    <p className="mt-4 flex gap-2 text-[10px] leading-5 text-zinc-600"><Info className="mt-0.5 h-3 w-3 shrink-0"/> Captures are stored as immutable snapshots, capped at 1 MB and 10 seconds, and do not follow redirects. Approval makes the snapshot visible as reviewed evidence, not a universal hiring claim.</p>
  </section>;
}

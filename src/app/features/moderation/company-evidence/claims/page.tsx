"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

type Capture = { id: string; company: string; sourceTitle: string; sourceUrl: string; retrievedAt: string; excerpt: string; contentHash: string };
type Claim = { id: string; captureId: string; company: string; role: string; claimType: string; claimText: string; supportingExcerpt: string; createdAt: string; capture: { sourceTitle: string; sourceUrl: string; retrievedAt: string; contentHash: string } };

export default function EvidenceClaimsPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [captureId, setCaptureId] = useState("");
  const [role, setRole] = useState("");
  const [claimType, setClaimType] = useState<"explicit_requirement" | "employer_guidance">("employer_guidance");
  const [claimText, setClaimText] = useState("");
  const [supportingExcerpt, setSupportingExcerpt] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/company-evidence/claims", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load claims workspace.");
      setCaptures(data.captures ?? []); setClaims(data.claims ?? []);
      setCaptureId(current => current || data.captures?.[0]?.id || "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load claims workspace."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const selected = captures.find(item => item.id === captureId);
  async function createClaim(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/company-evidence/claims", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captureId, role, claimType, claimText, supportingExcerpt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save claim.");
      setClaimText(""); setSupportingExcerpt(""); setNotice("Claim submitted for a separate moderator review.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save claim."); }
    finally { setBusy(false); }
  }
  async function review(claimId: string, decision: "approve" | "reject") {
    setBusyId(claimId); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/company-evidence/claims", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, decision, reviewNote: reviewNotes[claimId]?.trim() || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Review failed.");
      setNotice(decision === "approve" ? "Claim approved for role-specific evidence." : "Claim rejected.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Review failed."); }
    finally { setBusyId(""); }
  }
  const field = "mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] px-3 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400/50";
  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/features/moderation/company-evidence" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Source review</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300"><RefreshCw className="h-3.5 w-3.5"/> Refresh</button>
    </header>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><ShieldCheck className="h-4 w-4"/> CLAIM EXTRACTION & PROVENANCE</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Evidence claims.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">Convert a reviewed source snapshot into a narrowly scoped company-and-role claim. The supporting passage must be copied exactly from the approved snapshot. Claim approval is a second, separate decision.</p>
      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/20 p-4 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-300/20 p-4 text-sm text-emerald-200">{notice}</p>}
      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={createClaim} className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Create a source-linked claim</h2>
          <label className="mt-5 block text-xs text-zinc-400">Approved source snapshot<select required value={captureId} onChange={event=>setCaptureId(event.target.value)} className={field}><option value="">Select snapshot</option>{captures.map(item=><option key={item.id} value={item.id}>{item.company} · {item.sourceTitle} · {new Date(item.retrievedAt).toLocaleDateString()}</option>)}</select></label>
          {selected && <div className="mt-3 rounded-xl bg-black/20 p-3"><a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-200 underline">{selected.sourceUrl}</a><p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-[11px] leading-5 text-zinc-400">{selected.excerpt}</p><p className="mt-2 break-all text-[9px] text-zinc-600">SHA-256 {selected.contentHash}</p></div>}
          <label className="mt-4 block text-xs text-zinc-400">Applicable role<input required maxLength={100} value={role} onChange={event=>setRole(event.target.value)} className={field} placeholder="e.g. Backend Engineer"/></label>
          <label className="mt-4 block text-xs text-zinc-400">Claim classification<select value={claimType} onChange={event=>setClaimType(event.target.value as typeof claimType)} className={field}><option value="employer_guidance">Employer guidance</option><option value="explicit_requirement">Explicit requirement</option></select></label>
          <label className="mt-4 block text-xs text-zinc-400">Normalized claim<textarea required maxLength={500} value={claimText} onChange={event=>setClaimText(event.target.value)} className={field+" min-h-20"} placeholder="Summarize only what the cited passage supports."/></label>
          <label className="mt-4 block text-xs text-zinc-400">Exact supporting passage<textarea required minLength={12} maxLength={1200} value={supportingExcerpt} onChange={event=>setSupportingExcerpt(event.target.value)} className={field+" min-h-28"} placeholder="Paste an exact, contiguous passage from the selected snapshot."/></label>
          <p className="mt-2 text-[10px] leading-5 text-zinc-500">The server verifies this passage is an exact substring of the stored approved snapshot. It does not infer facts or validate the interpretation automatically.</p>
          <button disabled={busy || !captures.length} className="mt-5 w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold disabled:opacity-40">{busy ? "Submitting…" : "Submit claim for review"}</button>
        </form>
        <div>
          <h2 className="text-lg font-semibold">Pending claim reviews <span className="ml-2 text-sm text-zinc-500">{claims.length}</span></h2>
          {loading && <p className="mt-4 text-sm text-zinc-500">Loading…</p>}
          {!loading && claims.length===0 && <p className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-sm text-zinc-500">No pending claims.</p>}
          <div className="mt-4 space-y-4">{claims.map(item=><article key={item.id} className="rounded-2xl border border-white/10 bg-[#111119] p-4">
            <p className="text-[10px] text-violet-300">{item.company} · {item.role} · {item.claimType === "explicit_requirement" ? "Explicit requirement" : "Employer guidance"}</p>
            <h3 className="mt-2 text-sm font-semibold leading-6">{item.claimText}</h3>
            <blockquote className="mt-3 border-l-2 border-violet-400/40 pl-3 text-xs leading-5 text-zinc-400">{item.supportingExcerpt}</blockquote>
            <a href={item.capture.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[10px] text-violet-200 underline">{item.capture.sourceTitle}</a>
            <textarea maxLength={500} value={reviewNotes[item.id] ?? ""} onChange={event=>setReviewNotes(current=>({...current,[item.id]:event.target.value}))} className={field+" min-h-16"} placeholder="Review note (optional)"/>
            <div className="mt-3 flex justify-end gap-2"><button disabled={busyId===item.id} onClick={()=>void review(item.id,"reject")} className="inline-flex items-center gap-1 rounded-lg border border-rose-300/20 px-3 py-2 text-xs text-rose-200"><XCircle className="h-3.5 w-3.5"/> Reject</button><button disabled={busyId===item.id} onClick={()=>void review(item.id,"approve")} className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5"/> Approve claim</button></div>
          </article>)}</div>
        </div>
      </div>
      <p className="mt-8 text-[11px] leading-5 text-zinc-600">Only moderators/admins can create or review claims. Authors cannot approve their own claims. Claims are not yet injected into preparation roadmaps; that requires the next integration phase.</p>
    </section>
  </main>;
}

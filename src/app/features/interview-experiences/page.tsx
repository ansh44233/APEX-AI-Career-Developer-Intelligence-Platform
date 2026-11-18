"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, BookOpen, ExternalLink, MessageSquareText, ShieldCheck, Upload } from "lucide-react";
import { companyDirectory, companyRoles } from "@/lib/company-directory";
import { communityReportFreshness } from "@/lib/company-intelligence-freshness";

type Report = {
  id: string; company: string; role: string; experienceLevel: string; roundType: string;
  difficulty: string; interviewDate: string | null; questionText: string; experienceNote: string | null;
  sourceUrl: string | null; createdAt: string;
};

function reportFreshness(interviewDate: string | null) {
  const state = communityReportFreshness(interviewDate);
  if (state === "unknown") return interviewDate ? "Interview date unavailable · freshness unknown" : "Interview date not provided · freshness unknown";
  if (state === "future") return "Future interview date · verify report";
  return state === "stale" ? "Older than 90 days · potentially stale" : "Within the last 90 days";
}

const levels = ["Internship", "Entry level / Graduate", "1–3 years", "3–6 years", "6+ years"];
const rounds = ["Online assessment", "Technical", "Coding", "System design", "Behavioural / HR", "Managerial", "Other"];
const difficulties = ["Easy", "Medium", "Hard", "Mixed", "Not sure"];

export default function InterviewExperiencesPage() {
  const [company, setCompany] = useState("All companies");
  const [role, setRole] = useState("All roles");
  const [round, setRound] = useState("All rounds");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [formCompany, setFormCompany] = useState("Google");
  const [formRole, setFormRole] = useState("Software Engineer");
  const [level, setLevel] = useState(levels[1]);
  const [formRound, setFormRound] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [date, setDate] = useState("");
  const [question, setQuestion] = useState("");
  const [note, setNote] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [firsthand, setFirsthand] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (company !== "All companies") params.set("company", company);
    if (role !== "All roles") params.set("role", role);
    if (round !== "All rounds") params.set("round", round);
    try {
      const response = await fetch("/api/interview-experiences?" + params.toString(), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load reports.");
      setReports(data.reports ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, [company, role, round]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCompany = params.get("company");
    const initialRole = params.get("role");
    if (initialCompany && companyDirectory.some(item => item.name === initialCompany)) { setCompany(initialCompany); setFormCompany(initialCompany); }
    if (initialRole && companyRoles.includes(initialRole)) { setRole(initialRole); setFormRole(initialRole); }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/interview-experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: formCompany, role: formRole, experienceLevel: level, roundType: formRound,
          difficulty, interviewDate: date || null, questionText: question, experienceNote: note || null,
          sourceUrl: sourceUrl || null, confirmFirsthand: firsthand,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed. Sign in and try again.");
      setMessage("Submitted successfully. Your report is pending review and is not public yet.");
      setQuestion(""); setNote(""); setSourceUrl(""); setDate(""); setFirsthand(false);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const field = "mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] px-3 py-3 text-sm text-zinc-100 outline-none focus:border-violet-400/50";
  const label = "block text-xs text-zinc-400";

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/features/company-intelligence" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Company Intelligence</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/features/question-bank" className="text-xs text-zinc-400 hover:text-white">Practice bank <BookOpen className="ml-1 inline h-3.5 w-3.5"/></a>
    </header>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><MessageSquareText className="h-4 w-4"/> COMMUNITY INTELLIGENCE</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Interview experiences.<br/><span className="text-violet-300">With provenance.</span></h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">Browse approved first-hand interview reports and contribute your own experience. APEX keeps community reports separate from official company guidance and original practice questions.</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Approved community reports</h2><span className="text-xs text-zinc-500">{reports.length} reports shown</span></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <label className={label}>Company<select className={field} value={company} onChange={e=>setCompany(e.target.value)}><option>All companies</option>{companyDirectory.map(item=><option key={item.name}>{item.name}</option>)}</select></label>
            <label className={label}>Role<select className={field} value={role} onChange={e=>setRole(e.target.value)}><option>All roles</option>{companyRoles.map(item=><option key={item}>{item}</option>)}</select></label>
            <label className={label}>Round<select className={field} value={round} onChange={e=>setRound(e.target.value)}><option>All rounds</option>{rounds.map(item=><option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="mt-5 space-y-3">
            {loading && <p className="rounded-xl border border-white/10 p-6 text-sm text-zinc-500">Loading approved reports…</p>}
            {!loading && error && <p className="rounded-xl border border-rose-300/20 bg-rose-300/[0.04] p-5 text-sm text-rose-200">{error} The database migration must be applied before this library can load.</p>}
            {!loading && !error && reports.length===0 && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center"><ShieldCheck className="mx-auto h-6 w-6 text-violet-300"/><p className="mt-3 text-sm font-medium">No approved reports yet</p><p className="mt-2 text-xs leading-5 text-zinc-500">This is an intentionally empty, moderated library—not a collection of invented company questions. Be the first to contribute a genuine experience.</p></div>}
            {reports.map(report=><article key={report.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-[10px]"><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.05] px-2.5 py-1 text-emerald-200">Approved community report</span><span className="text-zinc-500">{report.company} · {report.role}</span></div>
              <h3 className="mt-3 text-sm font-semibold">{report.questionText}</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-zinc-500"><span>{report.experienceLevel}</span><span>·</span><span>{report.roundType}</span><span>·</span><span>{report.difficulty}</span><span>·</span><span>{report.interviewDate ? new Date(report.interviewDate).toLocaleDateString() : "Date not provided"}</span><span>·</span><span className={communityReportFreshness(report.interviewDate) === "stale" || communityReportFreshness(report.interviewDate) === "future" ? "text-amber-300" : "text-zinc-500"}>{reportFreshness(report.interviewDate)}</span></div>
              {report.experienceNote && <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-zinc-400">{report.experienceNote}</p>}
              {report.sourceUrl && <a href={report.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-violet-200 underline">View cited source <ExternalLink className="h-3 w-3"/></a>}
            </article>)}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <div className="flex items-center gap-2"><Upload className="h-4 w-4 text-violet-300"/><h2 className="font-semibold">Contribute an experience</h2></div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">Only submit an experience you personally took part in. Do not include confidential interview material, personal data, recruiter contact details or anything covered by an NDA.</p>
          <form onSubmit={submitReport} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>Company<select required className={field} value={formCompany} onChange={e=>setFormCompany(e.target.value)}>{companyDirectory.map(item=><option key={item.name}>{item.name}</option>)}</select></label>
              <label className={label}>Role<select required className={field} value={formRole} onChange={e=>setFormRole(e.target.value)}>{companyRoles.map(item=><option key={item}>{item}</option>)}</select></label>
              <label className={label}>Experience level<select required className={field} value={level} onChange={e=>setLevel(e.target.value)}>{levels.map(item=><option key={item}>{item}</option>)}</select></label>
              <label className={label}>Interview round<select required className={field} value={formRound} onChange={e=>setFormRound(e.target.value)}>{rounds.map(item=><option key={item}>{item}</option>)}</select></label>
              <label className={label}>Difficulty<select required className={field} value={difficulty} onChange={e=>setDifficulty(e.target.value)}>{difficulties.map(item=><option key={item}>{item}</option>)}</select></label>
              <label className={label}>Approximate interview date<input type="date" className={field} value={date} onChange={e=>setDate(e.target.value)}/></label>
            </div>
            <label className={label}>Question or topic you remember<textarea required minLength={10} maxLength={1200} className={field+" min-h-28"} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Describe the question or topic in your own words…"/></label>
            <label className={label}>Additional context (optional)<textarea maxLength={2500} className={field+" min-h-24"} value={note} onChange={e=>setNote(e.target.value)} placeholder="Round format, what you were asked to explain, or useful context…"/></label>
            <label className={label}>Public source URL (optional)<input type="url" className={field} value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://…"/></label>
            <label className="flex items-start gap-3 text-xs leading-5 text-zinc-400"><input type="checkbox" checked={firsthand} onChange={e=>setFirsthand(e.target.checked)} required className="mt-1 accent-violet-400"/><span>I confirm this is my first-hand experience, I have permission to share it, and it contains no confidential or personal information.</span></label>
            <button type="submit" disabled={submitting || !firsthand} className="w-full rounded-xl bg-violet-500 px-5 py-3.5 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-40">{submitting ? "Submitting…" : "Submit for review"}</button>
            {message && <p role="status" className="rounded-xl border border-white/10 p-3 text-xs leading-5 text-zinc-300">{message}</p>}
          </form>
          <p className="mt-4 text-[10px] leading-5 text-zinc-600">Submissions are private and pending by default. Only reports explicitly approved by a moderator appear in the public list. The current release has no self-service moderation dashboard.</p>
        </section>
      </div>
    </section>
  </main>;
}

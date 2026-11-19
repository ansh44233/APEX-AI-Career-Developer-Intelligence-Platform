"use client";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

import { useCallback, useEffect, useRef, useState } from "react";
import { PracticeEvaluationForm } from "@/components/practice-evaluation-form";
import { ArrowRight, BrainCircuit, CheckCircle2, Clock3, Loader2, Play, RefreshCw, Save, Sparkles } from "lucide-react";

type Prompt = { category: string; question: string; followUp: string; rubric: string[] };
type Session = { id: string; module: string; title: string; status: string; startedAt: string; completedAt: string | null; _count?: { attempts: number } };
type Attempt = { id: string; prompt: string; responseText: string | null; score: number | null; feedbackJson?: unknown; createdAt: string };
type Goal = { id: string; targetRole: string; targetCompany: string | null; status: string };
type GuidedTask = { task: { id: string; title: string; description: string; skillKey: string; phase: string; goal: { targetRole: string; targetCompany: string | null }; evidenceClaim: { claimType: string; supportingExcerpt: string; capture: { sourceTitle: string; sourceUrl: string } } | null }; recentSessions: Array<{ id: string; title: string; status: string; startedAt: string; _count: { attempts: number } }>; practiceGuidance: string[]; methodology: string };

const prompts: Prompt[] = [
  { category: "TECHNICAL · DATA STRUCTURES", question: "When would you choose a hash map over an array?", followUp: "What trade-offs would you consider if the input became very large?", rubric: ["Explains average O(1) lookup and insertion", "Mentions extra space and hashing overhead", "Recognises collisions and worst-case behaviour", "Connects the choice to the actual access pattern"] },
  { category: "BEHAVIOURAL · TEAMWORK", question: "Tell me about a time you received feedback that changed how you worked.", followUp: "What did you do differently afterwards, and what changed?", rubric: ["Sets a clear situation and context", "Explains their own actions", "Shows reflection rather than defensiveness", "Describes a concrete outcome"] },
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

export default function InterviewLab() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [active, setActive] = useState<Session | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [notice, setNotice] = useState("");
  const [guidedTask, setGuidedTask] = useState<GuidedTask | null>(null);
  const prompt = prompts[index];
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  const loadSessions = useCallback(async () => {
    try {
      const [data, goalData] = await Promise.all([api<{ sessions: Session[] }>("/api/practice/sessions?limit=20"), api<{ goals: Goal[] }>("/api/career-goals")]);
      setSessions(data.sessions);
      setGoals(goalData.goals.filter(goal => goal.status === "active"));
      setSelectedGoalId(current => current || goalData.goals.find(goal => goal.status === "active")?.id || "");
      setSignedIn(true);
    } catch (error) {
      if (error instanceof Error && error.message === "Authentication required.") setSignedIn(false);
      else if (error instanceof Error && error.message.includes("Authentication")) setSignedIn(false);
      else setNotice(error instanceof Error ? error.message : "Could not load practice history.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  useEffect(() => {
    const taskId = new URLSearchParams(window.location.search).get("taskId");
    if (!taskId) return;
    void api<GuidedTask>("/api/intelligence/practice-plan?taskId=" + encodeURIComponent(taskId))
      .then(setGuidedTask)
      .catch(error => setNotice(error instanceof Error ? error.message : "Could not load roadmap task context."));
  }, []);

  const autoOpenedSession = useRef(false);
  useEffect(() => {
    if (autoOpenedSession.current || !sessions.length) return;
    const requestedSessionId = new URLSearchParams(window.location.search).get("sessionId");
    if (!requestedSessionId) return;
    const requestedSession = sessions.find(item => item.id === requestedSessionId);
    if (!requestedSession) return;
    autoOpenedSession.current = true;
    void openSession(requestedSession);
  }, [sessions, openSession]);

  async function startSession() {
    setBusy(true); setNotice("");
    try {
      const data = await api<{ session: Session }>("/api/practice/sessions", { method: "POST", body: JSON.stringify({ module: "interview", title: "Interview practice session", ...(selectedGoalId ? { goalId: selectedGoalId } : {}) }) });
      setActive(data.session); setAttempts([]); setAnswer(""); setIndex(0); setReviewed(false);
      setNotice("Session started. Your answers will be saved to your account.");
      await loadSessions();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not start session."); }
    finally { setBusy(false); }
  }

  async function openSession(session: Session) {
    setBusy(true); setNotice("");
    try {
      const data = await api<{ attempts: Attempt[] }>(`/api/practice/sessions/${session.id}/attempts`);
      setActive(session); setAttempts(data.attempts); setAnswer(""); setIndex(0); setReviewed(false);
      setNotice("Session history loaded. Select a prompt to continue.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not load this session."); }
    finally { setBusy(false); }
  }

  async function saveAnswer() {
    if (!active || !answer.trim()) return;
    setBusy(true); setNotice("");
    try {
      const data = await api<{ attempt: Attempt }>(`/api/practice/sessions/${active.id}/attempts`, { method: "POST", body: JSON.stringify({ prompt: (guidedTask ? "ROADMAP|" + guidedTask.task.skillKey + "|" + guidedTask.task.title + " — " : "") + prompt.question, responseText: answer }) });
      setAttempts(previous => [data.attempt, ...previous]);
      setNotice("Answer saved to this practice session.");
      setReviewed(false);
      await loadSessions();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save answer."); }
    finally { setBusy(false); }
  }

  async function closeSession(status: "completed" | "abandoned") {
    if (!active) return;
    setBusy(true); setNotice("");
    try {
      await api(`/api/practice/sessions/${active.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice(status === "completed" ? "Session completed and saved." : "Session marked as abandoned.");
      setActive(null); setAnswer(""); await loadSessions();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not update session."); }
    finally { setBusy(false); }
  }

  const currentSaved = attempts.find(item => item.prompt === prompt.question || item.prompt.endsWith(prompt.question));
  return <ApexWorkspaceShell><div className="min-h-screen text-[var(--text)]">
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
      <div className="mb-10"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#c5f36a]"><BrainCircuit className="h-4 w-4"/> FEATURE EXPERIENCE / 01</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">AI Interview Lab</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Practice with structured prompts, save your responses and return to unfinished sessions. Feedback remains a self-review checklist until an AI evaluation service is connected.</p></div>
      {notice && <div role="status" className="mb-5 rounded-xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.06] px-4 py-3 text-sm text-[#dff6ae]">{notice}</div>}
      {guidedTask && <section className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-5"><p className="text-[10px] font-semibold tracking-[0.18em] text-cyan-200">ROADMAP-LINKED PRACTICE · {guidedTask.task.skillKey.replaceAll("_", " ")}</p><h2 className="mt-2 text-lg font-semibold">{guidedTask.task.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--text)]">{guidedTask.task.description}</p><p className="mt-2 text-[11px] text-[var(--muted)]">{guidedTask.task.goal.targetRole}{guidedTask.task.goal.targetCompany ? " · " + guidedTask.task.goal.targetCompany : ""} · {guidedTask.task.phase}</p>{guidedTask.task.evidenceClaim && <div className="mt-3 rounded-xl border border-emerald-300/15 p-3"><p className="text-[10px] font-semibold text-emerald-200">MODERATOR-APPROVED SOURCE CONTEXT · {guidedTask.task.evidenceClaim.claimType.replaceAll("_", " ")}</p><p className="mt-2 text-xs text-[var(--text)]">{guidedTask.task.evidenceClaim.supportingExcerpt}</p><a href={guidedTask.task.evidenceClaim.capture.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[10px] text-cyan-200 underline">{guidedTask.task.evidenceClaim.capture.sourceTitle}</a></div>}<div className="mt-3"><p className="text-[10px] font-semibold text-[var(--muted)]">PRACTICE STRUCTURE</p><ul className="mt-2 grid gap-1 sm:grid-cols-2">{guidedTask.practiceGuidance.map(item=><li key={item} className="text-[11px] text-[var(--muted)]">• {item}</li>)}</ul></div><p className="mt-3 text-[10px] text-[var(--muted)]">{guidedTask.methodology} Task association is saved on this session; completing it does not mark the roadmap task complete.</p></section>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full border border-[#c5f36a]/15 bg-[#c5f36a]/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#dff6ae]">{prompt.category}</span><span className="text-xs text-[var(--muted)]">Prompt {index + 1} of {prompts.length}</span></div>
          <h2 className="mt-8 text-2xl font-semibold leading-snug sm:text-3xl">{prompt.question}</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">Take a moment to organise your thoughts. Aim for a clear explanation with an example.</p>
          <label htmlFor="answer" className="mt-8 block text-xs font-semibold text-[var(--text)]">YOUR RESPONSE</label>
          <textarea id="answer" value={answer} onChange={e => {setAnswer(e.target.value);setReviewed(false);}} placeholder="Structure your answer here..." className="mt-3 min-h-52 w-full resize-y rounded-2xl border border-[var(--line)] bg-black/20 p-4 text-sm leading-6 text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[#c5f36a]/50"/>
          <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--muted)]"><span>{words} words · {currentSaved ? "A saved response exists for this prompt" : "Save your response to keep it"}</span><span>{attempts.length} saved answer(s)</span></div>
          {active && active.title.startsWith("Learning task · ") && <div className="mb-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200">Guided roadmap focus</p><p className="mt-1 text-xs text-[var(--text)]">{active.title.replace("Learning task · ", "")}</p><p className="mt-1 text-[10px] text-[var(--muted)]">This session is linked to the career goal that owns this roadmap task.</p></div>}
          <div className="mt-6 flex flex-wrap gap-3">
            {!active ? <><label className="flex flex-col gap-2 text-[11px] text-[var(--muted)]">Link session to career goal<select value={selectedGoalId} onChange={event => setSelectedGoalId(event.target.value)} className="rounded-lg border border-[var(--line)] bg-zinc-900 px-3 py-2 text-xs text-[var(--text)]"><option value="">General practice (not linked)</option>{goals.map(goal => <option key={goal.id} value={goal.id}>{goal.targetRole}{goal.targetCompany ? " · " + goal.targetCompany : ""}</option>)}</select></label><button onClick={startSession} disabled={busy || !signedIn} className="rounded-xl bg-[#c5f36a] px-5 py-3 text-sm font-semibold transition hover:bg-[#c5f36a] disabled:opacity-40"><Play className="mr-2 inline h-4 w-4"/> Start a session</button></> : <button onClick={saveAnswer} disabled={busy || !answer.trim() || active.status !== "in_progress"} className="rounded-xl bg-[#c5f36a] px-5 py-3 text-sm font-semibold transition hover:bg-[#c5f36a] disabled:opacity-40"><Save className="mr-2 inline h-4 w-4"/> Save answer</button>}
            <button onClick={()=>{setIndex((index+1)%prompts.length);setAnswer("");setReviewed(false);}} className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm text-[var(--text)] hover:bg-white/[0.05]">Next prompt <ArrowRight className="ml-1 inline h-4 w-4"/></button>
            <button onClick={()=>setReviewed(true)} disabled={!answer.trim()} className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm text-[var(--text)] hover:bg-white/[0.05] disabled:opacity-40"><Sparkles className="mr-2 inline h-4 w-4"/> Self-review</button>
          </div>
          {active && <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--line)] pt-5">{active.status === "in_progress" ? <><button onClick={()=>closeSession("completed")} disabled={busy} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300/[0.06]">Complete session</button><button onClick={()=>closeSession("abandoned")} disabled={busy} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)] hover:bg-white/[0.05]">End for now</button><span className="self-center text-xs text-[var(--muted)]">Open session · saved to your account</span></> : <span className="self-center text-xs text-[var(--muted)]">Read-only · this session is {active.status.replace("_"," ")}</span>}</div>}
          {reviewed && <div className="mt-6 rounded-2xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.06] p-4"><p className="text-sm font-semibold text-[#dff6ae]"><CheckCircle2 className="mr-2 inline h-4 w-4"/> Self-review checklist ready</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">No AI model is scoring this response. Use the rubric to assess it yourself.</p><p className="mt-3 text-xs text-[var(--text)]">Follow-up question: {prompt.followUp}</p></div>}
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5"><p className="text-xs font-semibold tracking-wider text-[var(--muted)]">EVALUATION RUBRIC</p><h3 className="mt-3 text-lg font-semibold">What a strong answer covers</h3><ul className="mt-5 space-y-4">{prompt.rubric.map((item,i)=><li key={item} className="flex gap-3 text-sm leading-5 text-[var(--muted)]"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-[10px] text-[#dff6ae]">{i+1}</span>{item}</li>)}</ul></div>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold tracking-wider text-[var(--muted)]">YOUR PRACTICE HISTORY</p><button onClick={()=>{setLoading(true);void loadSessions();}} className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Refresh history"><RefreshCw className="h-4 w-4"/></button></div>
            {loading ? <p className="mt-4 text-xs text-[var(--muted)]"><Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin"/> Loading sessions…</p> : !signedIn ? <div className="mt-4"><p className="text-xs leading-5 text-[var(--muted)]">Sign in to save and revisit interview practice.</p><a href="/sign-in" className="mt-3 inline-block rounded-lg bg-white/[0.08] px-3 py-2 text-xs text-[var(--text)] hover:bg-white/[0.12]">Sign in to APEX</a></div> : sessions.length === 0 ? <p className="mt-4 text-xs text-[var(--muted)]">No sessions yet. Start one to build your practice history.</p> : <ul className="mt-4 space-y-2">{sessions.map(session=><li key={session.id}><button onClick={()=>openSession(session)} disabled={busy} className={`w-full rounded-xl border p-3 text-left transition hover:bg-white/[0.04] ${active?.id===session.id ? "border-[#c5f36a]/30 bg-[#c5f36a]/[0.06]" : "border-[var(--line)]"}`}><span className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--text)]"><span className="truncate">{session.title}</span><span className="shrink-0 text-[10px] text-[var(--muted)]">{session.status.replace("_"," ")}</span></span><span className="mt-2 flex items-center gap-2 text-[10px] text-[var(--muted)]"><Clock3 className="h-3 w-3"/>{new Date(session.startedAt).toLocaleDateString()} · {session._count?.attempts ?? 0} answers</span></button></li>)}</ul>}
          </div>
          {active && attempts.length > 0 && <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5"><p className="text-xs font-semibold tracking-wider text-[var(--muted)]">SAVED RESPONSES</p><ul className="mt-4 space-y-3">{attempts.map(item=><li key={item.id} className="rounded-xl border border-[var(--line)] bg-black/10 p-3"><p className="text-xs font-medium text-[var(--text)]">{item.prompt}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[var(--muted)]">{item.responseText || "No written response saved."}</p><p className="mt-2 text-[10px] text-[var(--muted)]">{new Date(item.createdAt).toLocaleString()}</p>{item.score !== null && <p className="mt-2 text-[10px] text-cyan-200">Your recorded rubric average: {Number(item.score).toFixed(2)}/5</p>}{active && <PracticeEvaluationForm key={item.id + String(item.score)} sessionId={active.id} attemptId={item.id} initialEvaluation={item.feedbackJson} onSaved={() => { if (active) void openSession(active); }}/>}</li>)}</ul></div>}
          <div className="rounded-3xl border border-amber-300/10 bg-amber-300/[0.04] p-5"><p className="text-xs font-semibold text-amber-200">CURRENT CAPABILITIES</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Session and answer persistence use the authenticated API. AI grading, voice interviews and adaptive follow-ups are not connected. Rubric ratings and feedback are learner-entered self-evaluations. A configured PostgreSQL database is required for persistence.</p></div>
        </aside>
      </div>
    </section>
  </div></ApexWorkspaceShell>;
}

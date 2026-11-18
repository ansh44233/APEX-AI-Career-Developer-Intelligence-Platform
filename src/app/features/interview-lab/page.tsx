"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, Clock3, Loader2, Play, RefreshCw, Save, Sparkles } from "lucide-react";

type Prompt = { category: string; question: string; followUp: string; rubric: string[] };
type Session = { id: string; module: string; title: string; status: string; startedAt: string; completedAt: string | null; _count?: { attempts: number } };
type Attempt = { id: string; prompt: string; responseText: string | null; score: number | null; createdAt: string };
type Goal = { id: string; targetRole: string; targetCompany: string | null; status: string };

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
      const data = await api<{ attempt: Attempt }>(`/api/practice/sessions/${active.id}/attempts`, { method: "POST", body: JSON.stringify({ prompt: prompt.question, responseText: answer }) });
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

  const currentSaved = attempts.find(item => item.prompt === prompt.question);
  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8"><a href="/" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> APEX home</a><span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span><a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a></header>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
      <div className="mb-10"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><BrainCircuit className="h-4 w-4"/> FEATURE EXPERIENCE / 01</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">AI Interview Lab</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">Practice with structured prompts, save your responses and return to unfinished sessions. Feedback remains a self-review checklist until an AI evaluation service is connected.</p></div>
      {notice && <div role="status" className="mb-5 rounded-xl border border-violet-300/15 bg-violet-400/[0.06] px-4 py-3 text-sm text-violet-100">{notice}</div>}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-wider text-violet-200">{prompt.category}</span><span className="text-xs text-zinc-500">Prompt {index + 1} of {prompts.length}</span></div>
          <h2 className="mt-8 text-2xl font-semibold leading-snug sm:text-3xl">{prompt.question}</h2>
          <p className="mt-3 text-sm text-zinc-500">Take a moment to organise your thoughts. Aim for a clear explanation with an example.</p>
          <label htmlFor="answer" className="mt-8 block text-xs font-semibold text-zinc-300">YOUR RESPONSE</label>
          <textarea id="answer" value={answer} onChange={e => {setAnswer(e.target.value);setReviewed(false);}} placeholder="Structure your answer here..." className="mt-3 min-h-52 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50"/>
          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500"><span>{words} words · {currentSaved ? "A saved response exists for this prompt" : "Save your response to keep it"}</span><span>{attempts.length} saved answer(s)</span></div>
          {active && active.title.startsWith("Learning task · ") && <div className="mb-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200">Guided roadmap focus</p><p className="mt-1 text-xs text-zinc-200">{active.title.replace("Learning task · ", "")}</p><p className="mt-1 text-[10px] text-zinc-500">This session is linked to the career goal that owns this roadmap task.</p></div>}
          <div className="mt-6 flex flex-wrap gap-3">
            {!active ? <><label className="flex flex-col gap-2 text-[11px] text-zinc-400">Link session to career goal<select value={selectedGoalId} onChange={event => setSelectedGoalId(event.target.value)} className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-zinc-200"><option value="">General practice (not linked)</option>{goals.map(goal => <option key={goal.id} value={goal.id}>{goal.targetRole}{goal.targetCompany ? " · " + goal.targetCompany : ""}</option>)}</select></label><button onClick={startSession} disabled={busy || !signedIn} className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold transition hover:bg-violet-400 disabled:opacity-40"><Play className="mr-2 inline h-4 w-4"/> Start a session</button></> : <button onClick={saveAnswer} disabled={busy || !answer.trim() || active.status !== "in_progress"} className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold transition hover:bg-violet-400 disabled:opacity-40"><Save className="mr-2 inline h-4 w-4"/> Save answer</button>}
            <button onClick={()=>{setIndex((index+1)%prompts.length);setAnswer("");setReviewed(false);}} className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300 hover:bg-white/[0.05]">Next prompt <ArrowRight className="ml-1 inline h-4 w-4"/></button>
            <button onClick={()=>setReviewed(true)} disabled={!answer.trim()} className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300 hover:bg-white/[0.05] disabled:opacity-40"><Sparkles className="mr-2 inline h-4 w-4"/> Self-review</button>
          </div>
          {active && <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">{active.status === "in_progress" ? <><button onClick={()=>closeSession("completed")} disabled={busy} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300/[0.06]">Complete session</button><button onClick={()=>closeSession("abandoned")} disabled={busy} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.05]">End for now</button><span className="self-center text-xs text-zinc-500">Open session · saved to your account</span></> : <span className="self-center text-xs text-zinc-500">Read-only · this session is {active.status.replace("_"," ")}</span>}</div>}
          {reviewed && <div className="mt-6 rounded-2xl border border-violet-300/15 bg-violet-400/[0.06] p-4"><p className="text-sm font-semibold text-violet-200"><CheckCircle2 className="mr-2 inline h-4 w-4"/> Self-review checklist ready</p><p className="mt-2 text-xs leading-5 text-zinc-400">No AI model is scoring this response. Use the rubric to assess it yourself.</p><p className="mt-3 text-xs text-zinc-300">Follow-up question: {prompt.followUp}</p></div>}
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#111119] p-5"><p className="text-xs font-semibold tracking-wider text-zinc-400">EVALUATION RUBRIC</p><h3 className="mt-3 text-lg font-semibold">What a strong answer covers</h3><ul className="mt-5 space-y-4">{prompt.rubric.map((item,i)=><li key={item} className="flex gap-3 text-sm leading-5 text-zinc-400"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-[10px] text-violet-200">{i+1}</span>{item}</li>)}</ul></div>
          <div className="rounded-3xl border border-white/10 bg-[#111119] p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold tracking-wider text-zinc-400">YOUR PRACTICE HISTORY</p><button onClick={()=>{setLoading(true);void loadSessions();}} className="text-zinc-500 hover:text-white" aria-label="Refresh history"><RefreshCw className="h-4 w-4"/></button></div>
            {loading ? <p className="mt-4 text-xs text-zinc-500"><Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin"/> Loading sessions…</p> : !signedIn ? <div className="mt-4"><p className="text-xs leading-5 text-zinc-500">Sign in to save and revisit interview practice.</p><a href="/sign-in" className="mt-3 inline-block rounded-lg bg-white/[0.08] px-3 py-2 text-xs text-white hover:bg-white/[0.12]">Sign in to APEX</a></div> : sessions.length === 0 ? <p className="mt-4 text-xs text-zinc-500">No sessions yet. Start one to build your practice history.</p> : <ul className="mt-4 space-y-2">{sessions.map(session=><li key={session.id}><button onClick={()=>openSession(session)} disabled={busy} className={`w-full rounded-xl border p-3 text-left transition hover:bg-white/[0.04] ${active?.id===session.id ? "border-violet-300/30 bg-violet-400/[0.06]" : "border-white/[0.07]"}`}><span className="flex items-center justify-between gap-2 text-xs font-medium text-zinc-200"><span className="truncate">{session.title}</span><span className="shrink-0 text-[10px] text-zinc-500">{session.status.replace("_"," ")}</span></span><span className="mt-2 flex items-center gap-2 text-[10px] text-zinc-500"><Clock3 className="h-3 w-3"/>{new Date(session.startedAt).toLocaleDateString()} · {session._count?.attempts ?? 0} answers</span></button></li>)}</ul>}
          </div>
          {active && attempts.length > 0 && <div className="rounded-3xl border border-white/10 bg-[#111119] p-5"><p className="text-xs font-semibold tracking-wider text-zinc-400">SAVED RESPONSES</p><ul className="mt-4 space-y-3">{attempts.map(item=><li key={item.id} className="rounded-xl border border-white/[0.07] bg-black/10 p-3"><p className="text-xs font-medium text-zinc-200">{item.prompt}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-500">{item.responseText || "No written response saved."}</p><p className="mt-2 text-[10px] text-zinc-600">{new Date(item.createdAt).toLocaleString()}</p></li>)}</ul></div>}
          <div className="rounded-3xl border border-amber-300/10 bg-amber-300/[0.04] p-5"><p className="text-xs font-semibold text-amber-200">CURRENT CAPABILITIES</p><p className="mt-2 text-xs leading-5 text-zinc-500">Session and answer persistence use the authenticated API. AI evaluation, voice interviews and adaptive follow-ups are not connected. A configured PostgreSQL database is required for persistence.</p></div>
        </aside>
      </div>
    </section>
  </main>;
}

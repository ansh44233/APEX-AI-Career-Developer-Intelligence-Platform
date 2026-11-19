"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PracticeEvaluationForm } from "@/components/practice-evaluation-form";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Code2, Lightbulb, Loader2, Play, RefreshCw, RotateCcw, Save, TerminalSquare } from "lucide-react";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

type Session = { id: string; module: string; title: string; status: string; startedAt: string; completedAt: string | null; _count?: { attempts: number } };
type Attempt = { id: string; prompt: string; responseText: string | null; score: number | null; feedbackJson?: Record<string, unknown> | null; createdAt: string };
type Goal = { id: string; targetRole: string; targetCompany: string | null; status: string };
type GuidedTask = { task: { id: string; title: string; description: string; skillKey: string; phase: string; goal: { targetRole: string; targetCompany: string | null }; evidenceClaim: { claimType: string; claimText: string; supportingExcerpt: string; capture: { sourceTitle: string; sourceUrl: string; retrievedAt: string; contentHash: string } } | null }; recentSessions: Array<{ id: string; title: string; status: string; startedAt: string; _count: { attempts: number } }>; practiceGuidance: string[]; methodology: string };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

const challenges = [
  { id: "two-sum", title: "Two Sum", category: "Arrays · Hash Map", difficulty: "Easy", prompt: "Given an array of integers nums and an integer target, return the indices of two numbers that add up to the target. Do not use the same element twice. Explain your approach and complexity.", hint: "{selectedChallenge.hint}", checks: ["Does your approach avoid reusing the same index?", "Can you explain the time and space complexity?", "Does it handle negative values and repeated numbers?"] },
  { id: "longest-substring", title: "Longest Substring Without Repeating Characters", category: "Strings · Sliding Window", difficulty: "Medium", prompt: "Given a string s, return the length of the longest substring without repeating characters. Explain the invariant maintained by your window and analyse the complexity.", hint: "Maintain a window containing unique characters. When a duplicate appears, move the left boundary past its previous occurrence.", checks: ["Does the window always contain unique characters?", "Can the left pointer move only forward?", "Does your solution handle an empty string and repeated characters?"] },
  { id: "merge-intervals", title: "Merge Intervals", category: "Arrays · Sorting", difficulty: "Medium", prompt: "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals and return the non-overlapping intervals. Explain sorting and boundary handling.", hint: "Sort intervals by start time, then compare each interval with the end of the last interval in your result.", checks: ["Are intervals sorted by their start value?", "Do you correctly merge overlapping boundaries?", "What are the time and space complexities?"] },
  { id: "valid-parentheses", title: "Valid Parentheses", category: "Stack · Strings", difficulty: "Easy", prompt: "Given a string containing only parentheses, braces and square brackets, determine whether the input is valid. Every opening bracket must be closed by the same type in the correct order.", hint: "Use a stack. Each closing bracket should match the most recent unmatched opening bracket.", checks: ["Does every closing bracket match the stack top?", "Do you reject leftover opening brackets?", "Do you handle a closing bracket when the stack is empty?"] },
] as const;

export default function OAArena() {
  const [showHint, setShowHint] = useState(false);\n  const [challengeId, setChallengeId] = useState<(typeof challenges)[number]["id"]>("two-sum");\n  const selectedChallenge = challenges.find(item => item.id === challengeId) ?? challenges[0];
  const [showChecks, setShowChecks] = useState(false);
  const [attempt, setAttempt] = useState("");
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
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const [data, goalData] = await Promise.all([api<{ sessions: Session[] }>("/api/practice/sessions?limit=20"), api<{ goals: Goal[] }>("/api/career-goals")]);
      setSessions(data.sessions); setGoals(goalData.goals.filter(goal => goal.status === "active")); setSelectedGoalId(current => current || goalData.goals.find(goal => goal.status === "active")?.id || ""); setSignedIn(true);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Authentication")) setSignedIn(false);
      else setNotice(error instanceof Error ? error.message : "Could not load coding practice history.");
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
      const data = await api<{ session: Session }>("/api/practice/sessions", { method: "POST", body: JSON.stringify({ module: "coding", title: "OA Arena · " + (guidedTask ? guidedTask.task.title : selectedChallenge.title), ...(selectedGoalId ? { goalId: selectedGoalId } : {}) }) });
      setActive(data.session); setAttempts([]); setAttempt(""); setShowChecks(false);
      setNotice("Coding session started. Save your approach to keep it in your account.");
      await loadSessions();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not start coding session."); }
    finally { setBusy(false); }
  }

  async function openSession(session: Session) {
    setBusy(true); setNotice("");
    try {
      const data = await api<{ attempts: Attempt[] }>(`/api/practice/sessions/${session.id}/attempts`);
      setActive(session); setAttempts(data.attempts); setAttempt(""); setShowChecks(false);
      setNotice("Saved coding session loaded.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not load this session."); }
    finally { setBusy(false); }
  }

  async function saveAttempt() {
    if (!active || !attempt.trim() || active.status !== "in_progress") return;
    setBusy(true); setNotice("");
    try {
      const data = await api<{ attempt: Attempt }>(`/api/practice/sessions/${active.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({ prompt: (guidedTask ? "ROADMAP|" + guidedTask.task.skillKey + "|" + guidedTask.task.title + " — " : "") + selectedChallenge.title + " — " + selectedChallenge.prompt, responseText: attempt }),
      });
      setAttempts(previous => [data.attempt, ...previous]);
      setNotice("Your approach was saved to this coding session.");
      setShowChecks(false);
      await loadSessions();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save your approach."); }
    finally { setBusy(false); }
  }

  async function reviewWithAI(attemptId: string) {
    if (!active) return;
    setReviewingId(attemptId); setNotice("");
    try {
      await api(`/api/practice/sessions/${active.id}/attempts/${attemptId}/review`, { method: "POST", body: JSON.stringify({}) });
      await openSession(active);
      setNotice("AI review saved. It is static educational feedback, not code execution or test grading.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not review this submission."); }
    finally { setReviewingId(null); }
  }

  async function closeSession(status: "completed" | "abandoned") {
    if (!active) return;
    setBusy(true); setNotice("");
    try {
      await api(`/api/practice/sessions/${active.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setNotice(status === "completed" ? "Coding session completed." : "Coding session ended and saved.");
      setActive(null); setAttempt(""); await loadSessions();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not update session."); }
    finally { setBusy(false); }
  }

  return <ApexWorkspaceShell><main className="min-h-screen text-[var(--text)]">
    <section className="mx-auto max-w-[1500px] px-4 pb-12 pt-6 sm:px-7 lg:px-10">
      <div className="mb-9"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#c5f36a]"><Code2 className="h-4 w-4"/> FEATURE EXPERIENCE / 02</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">OA Arena</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Practice coding problems, save your approach and revisit previous sessions. Code execution and automated grading are not connected.</p></div>
      {notice && <div role="status" className="mb-5 rounded-xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.06] px-4 py-3 text-sm text-[#dff6ae]">{notice}</div>}
      {guidedTask && <section className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-5"><p className="text-[10px] font-semibold tracking-[0.18em] text-cyan-200">ROADMAP-LINKED PRACTICE · {guidedTask.task.skillKey.replaceAll("_", " ")}</p><h2 className="mt-2 text-lg font-semibold">{guidedTask.task.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--text)]">{guidedTask.task.description}</p><p className="mt-2 text-[11px] text-[var(--muted)]">{guidedTask.task.goal.targetRole}{guidedTask.task.goal.targetCompany ? " · " + guidedTask.task.goal.targetCompany : ""} · {guidedTask.task.phase}</p>{guidedTask.task.evidenceClaim && <div className="mt-3 rounded-xl border border-emerald-300/15 p-3"><p className="text-[10px] font-semibold text-emerald-200">MODERATOR-APPROVED SOURCE CONTEXT · {guidedTask.task.evidenceClaim.claimType.replaceAll("_", " ")}</p><p className="mt-2 text-xs text-[var(--text)]">{guidedTask.task.evidenceClaim.supportingExcerpt}</p><a href={guidedTask.task.evidenceClaim.capture.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[10px] text-cyan-200 underline">{guidedTask.task.evidenceClaim.capture.sourceTitle}</a></div>}<div className="mt-3"><p className="text-[10px] font-semibold text-[var(--muted)]">PRACTICE STRUCTURE</p><ul className="mt-2 grid gap-1 sm:grid-cols-2">{guidedTask.practiceGuidance.map(item=><li key={item} className="text-[11px] text-[var(--muted)]">• {item}</li>)}</ul></div><p className="mt-3 text-[10px] text-[var(--muted)]">{guidedTask.methodology} Task association is saved on this session; completing it does not mark the roadmap task complete.</p></section>}
      <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-6">
          <div className="flex items-center justify-between"><span className="rounded-full bg-[#c5f36a]/[0.08] px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#dff6ae]">ARRAYS · HASH MAP</span><span className="text-xs text-[var(--muted)]">Easy</span></div>
          <h2 className="mt-6 text-2xl font-semibold">{guidedTask ? "Your roadmap challenge" : "Two Sum"}</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">{guidedTask ? "Use the task brief above as your challenge. Demonstrate the skill, explain your reasoning and include an example or trade-off." : <>Given an array of integers <code className="text-[#dff6ae]">nums</code> and an integer <code className="text-[#dff6ae]">target</code>, return the indices of two numbers that add up to the target.</>}</p>
          {!guidedTask && {selectedChallenge.id === "two-sum" && <div className="mt-5 rounded-xl border border-[var(--line)] bg-black/20 p-4 font-mono text-xs leading-6"><p className="text-[var(--muted)]">Example 1</p><p>Input: nums = [2, 7, 11, 15], target = 9</p><p className="text-emerald-300">Output: [0, 1]</p><p className="mt-3 text-[var(--muted)]">Example 2</p><p>Input: nums = [3, 2, 4], target = 6</p><p className="text-emerald-300">Output: [1, 2]</p></div>}}
          {!guidedTask && <div className="mt-5 rounded-xl border border-[var(--line)] p-4"><p className="text-xs font-semibold text-[var(--text)]">What to demonstrate</p><ul className="mt-2 space-y-2 text-xs leading-5 text-[var(--muted)]">{selectedChallenge.checks.map(item => <li key={item}>• {item}</li>)}</ul></div>}
          {!guidedTask && <button onClick={()=>setShowHint(!showHint)} className="mt-6 rounded-xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.06] px-4 py-2.5 text-xs font-semibold text-[#dff6ae] hover:bg-[#c5f36a]/10"><Lightbulb className="mr-2 inline h-4 w-4"/>{showHint ? "Hide hint" : "Reveal hint"}</button>}
          {!guidedTask && showHint && <p className="mt-3 rounded-xl bg-white/[0.04] p-4 text-xs leading-5 text-[var(--muted)]">As you scan the array, store values you have already visited and their indices. For each value, check whether its complement has appeared.</p>}
        </section>
        <section className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4"><div className="flex items-center gap-2 text-sm font-semibold"><TerminalSquare className="h-4 w-4 text-[#c5f36a]"/> Workspace</div><span className="text-[10px] text-[var(--muted)]">JavaScript · Notes preview</span></div>
          <div className="p-4 sm:p-6"><label htmlFor="solution" className="text-xs font-semibold text-[var(--text)]">YOUR APPROACH / PSEUDOCODE / CODE NOTES</label><textarea id="solution" value={attempt} onChange={e=>{setAttempt(e.target.value);setShowChecks(false);}} placeholder="Describe your approach, write pseudocode or paste a code draft..." className="mt-3 min-h-64 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--app-bg)] p-4 font-mono text-xs leading-6 text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[#c5f36a]/50"/>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--muted)]"><span>{attempt.trim() ? attempt.trim().split(/\s+/).length : 0} words</span><span>{attempts.length} saved submission(s)</span></div>
            {active && active.title.startsWith("Learning task · ") && <div className="mb-4 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-200">Guided roadmap focus</p><p className="mt-1 text-xs text-[var(--text)]">{active.title.replace("Learning task · ", "")}</p><p className="mt-1 text-[10px] text-[var(--muted)]">This session is linked to the career goal that owns this roadmap task.</p></div>}
            <div className="mt-4 flex flex-wrap gap-3">
              {!active ? <><label className="flex flex-col gap-2 text-[11px] text-[var(--muted)]">Link session to career goal<select value={selectedGoalId} onChange={event => setSelectedGoalId(event.target.value)} className="rounded-lg border border-[var(--line)] bg-zinc-900 px-3 py-2 text-xs text-[var(--text)]"><option value="">General practice (not linked)</option>{goals.map(goal => <option key={goal.id} value={goal.id}>{goal.targetRole}{goal.targetCompany ? " · " + goal.targetCompany : ""}</option>)}</select></label><button onClick={startSession} disabled={busy || !signedIn} className="rounded-xl bg-[#a9d94c] px-4 py-3 text-xs font-semibold hover:bg-[#c5f36a] disabled:opacity-40"><Play className="mr-2 inline h-4 w-4"/> Start coding session</button></> : <button onClick={saveAttempt} disabled={busy || !attempt.trim() || active.status !== "in_progress"} className="rounded-xl bg-[#a9d94c] px-4 py-3 text-xs font-semibold hover:bg-[#c5f36a] disabled:opacity-40"><Save className="mr-2 inline h-4 w-4"/> Save submission</button>}
              <button onClick={()=>setShowChecks(true)} disabled={!attempt.trim()} className="rounded-xl border border-[var(--line)] px-4 py-3 text-xs text-[var(--text)] hover:bg-white/[0.05] disabled:opacity-40">Review approach <ArrowRight className="ml-1 inline h-4 w-4"/></button>
              <button onClick={()=>{setAttempt("");setShowChecks(false);}} className="rounded-xl border border-[var(--line)] px-4 py-3 text-xs text-[var(--text)] hover:bg-white/[0.05]"><RotateCcw className="mr-1 inline h-3.5 w-3.5"/> Reset</button>
            </div>
            {active && <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--line)] pt-5">{active.status === "in_progress" ? <><button onClick={()=>closeSession("completed")} disabled={busy} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300/[0.06]">Complete session</button><button onClick={()=>closeSession("abandoned")} disabled={busy} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)] hover:bg-white/[0.05]">End for now</button><span className="self-center text-xs text-[var(--muted)]">Open session · saved to your account</span></> : <span className="self-center text-xs text-[var(--muted)]">Read-only · this session is {active.status.replace("_"," ")}</span>}</div>}
            {showChecks && <div className="mt-5 rounded-2xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.06] p-4"><p className="text-sm font-semibold text-[#dff6ae]"><CheckCircle2 className="mr-2 inline h-4 w-4"/> Self-review checklist</p><ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--muted)]">{selectedChallenge.checks.map(item => <li key={item}>• {item}</li>)}</ul><p className="mt-3 text-[10px] text-[var(--muted)]">This preview does not execute code or grade submissions.</p></div>}
            {active && attempts.length > 0 && <div className="mt-5 rounded-2xl border border-[var(--line)] p-4"><p className="text-xs font-semibold tracking-wider text-[var(--muted)]">SAVED SUBMISSIONS</p><ul className="mt-3 space-y-3">{attempts.map(item=><li key={item.id} className="rounded-xl border border-[var(--line)] bg-black/10 p-3"><p className="text-xs font-medium text-[var(--text)]">{item.prompt}</p><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-[var(--muted)]">{item.responseText || "No notes saved."}</pre><p className="mt-2 text-[10px] text-[var(--muted)]">{new Date(item.createdAt).toLocaleString()}</p><button onClick={()=>reviewWithAI(item.id)} disabled={reviewingId !== null || !item.responseText} className="mt-3 rounded-lg border border-[#c5f36a]/20 px-3 py-2 text-[10px] font-semibold text-[#dff6ae] disabled:opacity-40">{reviewingId === item.id ? "Reviewing…" : "Review with APEX AI"}</button>{item.feedbackJson && typeof item.feedbackJson === "object" && "aiReview" in item.feedbackJson && item.feedbackJson.aiReview && typeof item.feedbackJson.aiReview === "object" && <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-3"><p className="text-[10px] font-semibold tracking-wider text-cyan-200">AI STATIC REVIEW · NOT A TEST SCORE</p><p className="mt-2 text-xs leading-5 text-[var(--text)]">{"summary" in (item.feedbackJson.aiReview as Record<string, unknown>) ? String((item.feedbackJson.aiReview as Record<string, unknown>).summary) : ""}</p>{(["strengths","issues","nextSteps"] as const).map(key=><div key={key} className="mt-2"><p className="text-[10px] font-semibold uppercase text-[var(--muted)]">{key === "nextSteps" ? "Next steps" : key}</p><ul className="mt-1 space-y-1">{Array.isArray((item.feedbackJson.aiReview as Record<string, unknown>)[key]) && ((item.feedbackJson.aiReview as Record<string, unknown>)[key] as unknown[]).map((line, index)=><li key={index} className="text-[11px] leading-5 text-[var(--muted)]">• {String(line)}</li>)}</ul></div>)}</div>}{item.score !== null && <p className="mt-2 text-[10px] text-cyan-200">Your recorded rubric average: {Number(item.score).toFixed(2)}/5</p>}{active && <PracticeEvaluationForm key={item.id + String(item.score)} sessionId={active.id} attemptId={item.id} initialEvaluation={item.feedbackJson} onSaved={() => { if (active) void openSession(active); }}/>}</li>)}</ul></div>}
            <div className="mt-6 rounded-xl border border-amber-300/10 bg-amber-300/[0.04] p-4"><p className="text-[10px] font-semibold tracking-wider text-amber-200">CAPABILITY STATUS</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Session and submission persistence use the authenticated API. Secure code execution, test-case evaluation, timers and automated grading are not connected. PostgreSQL must be configured for persistence.</p></div>
          </div>
        </section>
      </div>
      <section className="mt-6 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-wider text-[var(--muted)]">YOUR CODING PRACTICE HISTORY</p><p className="mt-1 text-xs text-[var(--muted)]">Your saved OA Arena sessions</p></div><button onClick={()=>{setLoading(true);void loadSessions();}} className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Refresh coding history"><RefreshCw className="h-4 w-4"/></button></div>
        {loading ? <p className="mt-4 text-xs text-[var(--muted)]"><Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin"/> Loading sessions…</p> : !signedIn ? <div className="mt-4"><p className="text-xs text-[var(--muted)]">Sign in to save and revisit coding practice.</p><a href="/sign-in" className="mt-3 inline-block rounded-lg bg-white/[0.08] px-3 py-2 text-xs text-[#11170a] hover:bg-white/[0.12]">Sign in to APEX</a></div> : sessions.length === 0 ? <p className="mt-4 text-xs text-[var(--muted)]">No coding sessions yet. Start one to build your history.</p> : <ul className="mt-4 grid gap-3 md:grid-cols-2">{sessions.filter(session=>session.module === "coding").map(session=><li key={session.id}><button onClick={()=>openSession(session)} disabled={busy} className={`w-full rounded-xl border p-3 text-left transition hover:bg-white/[0.04] ${active?.id===session.id ? "border-[#c5f36a]/30 bg-[#c5f36a]/[0.06]" : "border-[var(--line)]"}`}><span className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--text)]"><span className="truncate">{session.title}</span><span className="shrink-0 text-[10px] text-[var(--muted)]">{session.status.replace("_"," ")}</span></span><span className="mt-2 flex items-center gap-2 text-[10px] text-[var(--muted)]"><Clock3 className="h-3 w-3"/>{new Date(session.startedAt).toLocaleDateString()} · {session._count?.attempts ?? 0} submissions</span></button></li>)}</ul>}
      </section>
    </section>
  </main></ApexWorkspaceShell>;
}

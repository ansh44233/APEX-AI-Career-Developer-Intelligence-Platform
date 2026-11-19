"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, CheckCircle2, Clock3, Loader2, RefreshCw, Send, Sparkles, WandSparkles } from "lucide-react";
import { companyDirectory, companyRoles } from "@/lib/company-directory";

type Question = { id: string; title: string; prompt: string; followUp: string; minutes: number; rubric: string[] };
type Round = "Behavioural" | "Technical" | "System Design" | "Role-specific" | "Mixed";

async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

export default function MockInterview() {
  const [company, setCompany] = useState("General practice");
  const [role, setRole] = useState("Software Engineer");
  const [round, setRound] = useState<Round>("Mixed");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [count, setCount] = useState("3");
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [timer, setTimer] = useState(false);

  const current = questions[index];
  const progress = questions.length ? Math.round((saved.length / questions.length) * 100) : 0;

  async function generate() {
    setBusy(true); setError(""); setNotice(""); setFeedback(""); setAnswer(""); setSaved([]); setSessionId("");
    try {
      const data = await post<{ questions: Question[] }>("/api/interview/studio", { action: "generate", role, company, round, difficulty, count: Number(count), jobDescription });
      setQuestions(data.questions); setIndex(0);
      setNotice(`Generated ${data.questions.length} fresh questions. Generate another set whenever you want more practice.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not generate questions."); }
    finally { setBusy(false); }
  }

  async function reviewAnswer() {
    if (!current || answer.trim().length < 30) return;
    setBusy(true); setError(""); setFeedback("");
    try {
      const data = await post<{ feedback: string }>("/api/interview/studio", { action: "evaluate", role, company, round, difficulty, question: current.prompt, answer });
      setFeedback(data.feedback);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not review this answer."); }
    finally { setBusy(false); }
  }

  async function saveAnswer() {
    if (!current || !answer.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      let id = sessionId;
      if (!id) {
        const created = await post<{ session: { id: string } }>("/api/practice/sessions", { module: "interview", title: `Interview Studio · ${company} · ${role}` });
        id = created.session.id; setSessionId(id);
      }
      await post(`/api/practice/sessions/${id}/attempts`, {
        prompt: `STUDIO|${current.id}|Round: ${round}|Difficulty: ${difficulty}\n${current.prompt}`,
        responseText: answer.trim() + (feedback ? `\n\nAI feedback:\n${feedback}` : ""),
      });
      setSaved(old => old.includes(current.id) ? old : [...old, current.id]);
      setNotice("Your answer has been saved to your APEX practice history.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your answer."); }
    finally { setBusy(false); }
  }

  function nextQuestion() { setIndex(v => Math.min(questions.length - 1, v + 1)); setAnswer(""); setFeedback(""); setNotice(""); }
  function previousQuestion() { setIndex(v => Math.max(0, v - 1)); setAnswer(""); setFeedback(""); setNotice(""); }

  return <main className="min-h-screen bg-[#0b0e0b] text-white">
    <header className="border-b border-white/[0.07] bg-[#101510]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-[#9aa394] hover:text-white"><ArrowLeft className="h-4 w-4"/> Dashboard</Link>
        <Link href="/dashboard" className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#c8fa78] font-black text-[#11150d]">A</span><span className="font-black tracking-[0.14em]">APEX<span className="text-[#c8fa78]">.</span></span></Link>
        <span className="hidden rounded-full border border-[#c8fa78]/20 px-3 py-1.5 text-[10px] font-semibold text-[#d8ff9d] sm:inline-flex">INTERVIEW STUDIO</span>
      </div>
    </header>
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="mb-8"><p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#c8fa78]"><Sparkles className="h-4 w-4"/> PRACTISE WITH PURPOSE</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Interview Studio<span className="text-[#c8fa78]">.</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa394]">Generate fresh questions for your target role, answer one at a time, get constructive AI feedback and save your practice. There is no fixed nine-question limit.</p></div>

      <section className="mb-6 rounded-3xl border border-white/[0.08] bg-[#141a13] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c8fa78]/10 text-[#d8ff9d]"><WandSparkles className="h-5 w-5"/></span><div><h2 className="text-sm font-semibold">Build your practice session</h2><p className="mt-1 text-xs text-[#879381]">Change the settings and generate a new set whenever you need.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-[#9aa394]">Target role<select value={role} onChange={e=>setRole(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0e0b] p-3 text-sm text-white">{companyRoles.map(r=><option key={r}>{r}</option>)}</select></label>
          <label className="text-xs text-[#9aa394]">Company context<select value={company} onChange={e=>setCompany(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0e0b] p-3 text-sm text-white"><option>General practice</option>{companyDirectory.map(c=><option key={c.name}>{c.name}</option>)}</select></label>
          <label className="text-xs text-[#9aa394]">Interview round<select value={round} onChange={e=>setRound(e.target.value as Round)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0e0b] p-3 text-sm text-white">{(["Mixed","Behavioural","Technical","System Design","Role-specific"] as Round[]).map(r=><option key={r}>{r}</option>)}</select></label>
          <label className="text-xs text-[#9aa394]">Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0e0b] p-3 text-sm text-white">{["Beginner","Intermediate","Advanced"].map(d=><option key={d}>{d}</option>)}</select></label>
          <label className="text-xs text-[#9aa394]">Questions in this set<select value={count} onChange={e=>setCount(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0e0b] p-3 text-sm text-white">{["1","2","3","4","5"].map(n=><option key={n} value={n}>{n} questions</option>)}</select></label>
          <div className="flex items-end"><button onClick={generate} disabled={busy||!role.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c8fa78] px-4 py-3 text-sm font-bold text-[#11150d] hover:bg-[#dcff9e] disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<RefreshCw className="h-4 w-4"/>} Generate fresh questions</button></div>
        </div>
        <label className="mt-4 block text-xs text-[#9aa394]">Job description (optional, remove personal contact details)<textarea value={jobDescription} onChange={e=>setJobDescription(e.target.value.slice(0,6000))} rows={3} placeholder="Paste role responsibilities and requirements to make questions more relevant…" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0e0b] p-3 text-sm leading-6 text-white outline-none placeholder:text-[#687463] focus:border-[#c8fa78]/40"/></label>
      </section>

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.05] p-3 text-xs text-rose-200">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-[#c8fa78]/15 bg-[#c8fa78]/[0.05] p-3 text-xs text-[#d8ff9d]">{notice}</p>}

      {!current ? <section className="rounded-3xl border border-dashed border-white/15 bg-[#141a13]/60 px-6 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#c8fa78]/10 text-[#d8ff9d]"><Bot className="h-7 w-7"/></span><h2 className="mt-5 text-xl font-semibold">Your next interview starts here.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#879381]">Choose a role and generate your first set. You can keep generating new sets for different rounds and difficulty levels.</p></section> :
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-3xl border border-white/[0.08] bg-[#141a13] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-[#c8fa78]/10 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#d8ff9d]">{round.toUpperCase()} · {difficulty.toUpperCase()}</span><span className="text-xs text-[#879381]">Question {index+1} of {questions.length}</span></div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[#c8fa78] transition-all" style={{width:`${((index+1)/questions.length)*100}%`}}/></div>
          <div className="mt-7 flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><p className="text-xs text-[#879381]">{current.title}</p><h2 className="mt-3 text-xl font-semibold leading-relaxed sm:text-2xl">{current.prompt}</h2></div><div className="rounded-xl border border-white/10 px-3 py-2 text-center"><Clock3 className="mx-auto h-4 w-4 text-[#c8fa78]"/><p className="mt-1 text-lg font-semibold tabular-nums">{current.minutes} min</p><p className="text-[10px] text-[#879381]">suggested</p></div></div>
          <label className="mt-7 block text-xs font-semibold text-[#dce3d4]">YOUR ANSWER<textarea value={answer} onChange={e=>setAnswer(e.target.value.slice(0,10000))} rows={8} placeholder="Explain your reasoning. Use real examples and be clear about assumptions…" className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0b0e0b] p-4 text-sm leading-7 text-white outline-none placeholder:text-[#687463] focus:border-[#c8fa78]/40"/></label>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] text-[#687463]">{answer.length.toLocaleString()} / 10,000 characters</span><div className="flex flex-wrap gap-2"><button onClick={previousQuestion} disabled={index===0||busy} className="rounded-xl border border-white/10 px-3 py-2.5 text-xs text-[#dce3d4] disabled:opacity-30">Previous</button><button onClick={reviewAnswer} disabled={busy||answer.trim().length<30} className="inline-flex items-center gap-2 rounded-xl border border-[#c8fa78]/25 px-4 py-2.5 text-xs font-semibold text-[#d8ff9d] disabled:opacity-40">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Bot className="h-4 w-4"/>} Get AI feedback</button><button onClick={saveAnswer} disabled={busy||!answer.trim()||saved.includes(current.id)} className="inline-flex items-center gap-2 rounded-xl bg-[#c8fa78] px-4 py-2.5 text-xs font-bold text-[#11150d] disabled:opacity-40"><CheckCircle2 className="h-4 w-4"/> {saved.includes(current.id)?"Saved":"Save answer"}</button><button onClick={nextQuestion} disabled={index===questions.length-1||busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-[#dce3d4] disabled:opacity-30">Next <ArrowRight className="h-4 w-4"/></button></div></div>
          {feedback && <div className="mt-6 rounded-2xl border border-[#c8fa78]/15 bg-[#0b0e0b] p-5"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#d8ff9d]"><Bot className="h-4 w-4"/> AI answer review</div><div className="whitespace-pre-wrap text-sm leading-7 text-[#dce3d4]">{feedback}</div></div>}
          {current.followUp && <div className="mt-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[10px] font-bold tracking-wider text-[#879381]">INTERVIEWER FOLLOW-UP</p><p className="mt-2 text-sm leading-6 text-[#dce3d4]">{current.followUp}</p></div>}
        </section>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#141a13] p-5"><p className="text-xs font-semibold text-white">Session progress</p><p className="mt-3 text-3xl font-semibold tabular-nums">{saved.length}<span className="text-base text-[#879381]"> / {questions.length}</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[#c8fa78]" style={{width:`${progress}%`}}/></div><p className="mt-2 text-[10px] text-[#879381]">Answers saved to your account</p>{sessionId&&<p className="mt-3 text-[10px] text-[#d8ff9d]">Practice session saved</p>}</div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141a13] p-5"><p className="text-xs font-semibold text-white">Self-review checklist</p><ul className="mt-3 space-y-3">{current.rubric.map(item=><li key={item} className="flex gap-2 text-xs leading-5 text-[#9aa394]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c8fa78]"/>{item}</li>)}</ul></div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#141a13] p-5"><p className="text-xs font-semibold text-white">Keep practising</p><p className="mt-2 text-xs leading-5 text-[#879381]">Generate another set to get different prompts. Questions are AI-generated practice material, not verified company interview questions or a guarantee of interview outcomes.</p><button onClick={generate} disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#c8fa78]/25 px-3 py-2.5 text-xs font-semibold text-[#d8ff9d] hover:bg-[#c8fa78]/[0.06] disabled:opacity-40"><RefreshCw className="h-4 w-4"/> New question set</button></div>
        </aside>
      </div>}
      <p className="mt-7 text-center text-[10px] leading-5 text-[#687463]">AI feedback is coaching, not a hiring score. Use genuine examples, verify technical guidance and avoid sharing sensitive personal information.</p>
    </section>
  </main>;
}

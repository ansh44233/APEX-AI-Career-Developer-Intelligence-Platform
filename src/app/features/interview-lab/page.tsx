"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, MessageSquareText, RotateCcw, Sparkles } from "lucide-react";

const prompts = [
  { category: "TECHNICAL · DATA STRUCTURES", question: "When would you choose a hash map over an array?", followUp: "What trade-offs would you consider if the input became very large?", rubric: ["Explains average O(1) lookup and insertion", "Mentions extra space and hashing overhead", "Recognises collisions and worst-case behaviour", "Connects the choice to the actual access pattern"] },
  { category: "BEHAVIOURAL · TEAMWORK", question: "Tell me about a time you received feedback that changed how you worked.", followUp: "What did you do differently afterwards, and what changed?", rubric: ["Sets a clear situation and context", "Explains their own actions", "Shows reflection rather than defensiveness", "Describes a concrete outcome"] },
];

export default function InterviewLab() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const prompt = prompts[index];
  const words = answer.trim() ? answer.trim().split(/\\s+/).length : 0;
  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8"><a href="/" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> APEX home</a><span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span><a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a></header>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8">
      <div className="mb-10"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><BrainCircuit className="h-4 w-4"/> FEATURE EXPERIENCE / 01</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">AI Interview Lab</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">A guided interview practice concept. Work through a prompt, structure your response and compare it against a transparent evaluation rubric.</p></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-wider text-violet-200">{prompt.category}</span><span className="text-xs text-zinc-500">Prompt {index + 1} of {prompts.length}</span></div>
          <h2 className="mt-8 text-2xl font-semibold leading-snug sm:text-3xl">{prompt.question}</h2>
          <p className="mt-3 text-sm text-zinc-500">Take a moment to organise your thoughts. Aim for a clear explanation with an example.</p>
          <label htmlFor="answer" className="mt-8 block text-xs font-semibold text-zinc-300">YOUR RESPONSE</label>
          <textarea id="answer" value={answer} onChange={e => {setAnswer(e.target.value);setReviewed(false);}} placeholder="Structure your answer here..." className="mt-3 min-h-52 w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50"/>
          <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500"><span>{words} words · Your response stays in this preview</span><button onClick={()=>{setAnswer("");setReviewed(false);}} className="hover:text-white"><RotateCcw className="mr-1 inline h-3 w-3"/> Clear</button></div>
          <div className="mt-6 flex flex-wrap gap-3"><button onClick={()=>setReviewed(true)} disabled={!answer.trim()} className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="mr-2 inline h-4 w-4"/> Review against rubric</button><button onClick={()=>{setIndex((index+1)%prompts.length);setAnswer("");setReviewed(false);}} className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300 hover:bg-white/[0.05]">Next prompt <ArrowRight className="ml-1 inline h-4 w-4"/></button></div>
          {reviewed && <div className="mt-6 rounded-2xl border border-violet-300/15 bg-violet-400/[0.06] p-4"><p className="text-sm font-semibold text-violet-200"><CheckCircle2 className="mr-2 inline h-4 w-4"/> Review checklist ready</p><p className="mt-2 text-xs leading-5 text-zinc-400">This preview does not call an AI model or score your writing. Use the checklist at right to self-review your answer.</p><p className="mt-3 text-xs text-zinc-300">Follow-up question: {prompt.followUp}</p></div>}
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#111119] p-5"><p className="text-xs font-semibold tracking-wider text-zinc-400">EVALUATION RUBRIC</p><h3 className="mt-3 text-lg font-semibold">What a strong answer covers</h3><ul className="mt-5 space-y-4">{prompt.rubric.map((item,i)=><li key={item} className="flex gap-3 text-sm leading-5 text-zinc-400"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-[10px] text-violet-200">{i+1}</span>{item}</li>)}</ul></div>
          <div className="rounded-3xl border border-amber-300/10 bg-amber-300/[0.04] p-5"><p className="text-xs font-semibold text-amber-200">PREVIEW MODE</p><p className="mt-2 text-xs leading-5 text-zinc-500">Prompt navigation and self-review are interactive. AI feedback, voice interviews, session history and adaptive follow-ups are planned, not connected yet.</p></div>
        </aside>
      </div>
    </section>
  </main>;
}

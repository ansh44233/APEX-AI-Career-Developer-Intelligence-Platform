"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Code2, Lightbulb, RotateCcw, TerminalSquare } from "lucide-react";

export default function OAArena() {
  const [showHint, setShowHint] = useState(false);
  const [showChecks, setShowChecks] = useState(false);
  const [attempt, setAttempt] = useState("");
  const sample = "function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}";
  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8"><a href="/" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> APEX home</a><span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span><a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a></header>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8">
      <div className="mb-9"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><Code2 className="h-4 w-4"/> FEATURE EXPERIENCE / 02</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">OA Arena</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">A sample online-assessment workspace with a problem brief, examples, hints and a self-check rubric.</p></div>
      <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-3xl border border-white/10 bg-[#111119] p-6">
          <div className="flex items-center justify-between"><span className="rounded-full bg-violet-400/[0.08] px-3 py-1.5 text-[10px] font-semibold tracking-wider text-violet-200">ARRAYS · HASH MAP</span><span className="text-xs text-zinc-500">Easy</span></div>
          <h2 className="mt-6 text-2xl font-semibold">Two Sum</h2><p className="mt-3 text-sm leading-6 text-zinc-400">Given an array of integers <code className="text-violet-200">nums</code> and an integer <code className="text-violet-200">target</code>, return the indices of two numbers that add up to the target.</p>
          <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-4 font-mono text-xs leading-6"><p className="text-zinc-500">Example 1</p><p>Input: nums = [2, 7, 11, 15], target = 9</p><p className="text-emerald-300">Output: [0, 1]</p><p className="mt-3 text-zinc-500">Example 2</p><p>Input: nums = [3, 2, 4], target = 6</p><p className="text-emerald-300">Output: [1, 2]</p></div>
          <div className="mt-5 space-y-3 text-xs text-zinc-400"><p><strong className="text-zinc-200">Constraints</strong></p><p>• 2 ≤ nums.length ≤ 10⁴</p><p>• Each input has exactly one valid answer</p><p>• You may not use the same element twice</p></div>
          <button onClick={()=>setShowHint(!showHint)} className="mt-6 rounded-xl border border-violet-300/15 bg-violet-400/[0.06] px-4 py-2.5 text-xs font-semibold text-violet-200 hover:bg-violet-400/10"><Lightbulb className="mr-2 inline h-4 w-4"/>{showHint ? "Hide hint" : "Reveal hint"}</button>
          {showHint && <p className="mt-3 rounded-xl bg-white/[0.04] p-4 text-xs leading-5 text-zinc-400">As you scan the array, store values you have already visited and their indices. For each value, check whether its complement has appeared.</p>}
        </section>
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#111119]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div className="flex items-center gap-2 text-sm font-semibold"><TerminalSquare className="h-4 w-4 text-violet-300"/> Workspace</div><span className="text-[10px] text-zinc-500">JavaScript · Preview</span></div>
          <div className="p-4 sm:p-6"><label htmlFor="solution" className="text-xs font-semibold text-zinc-300">YOUR APPROACH / NOTES</label><textarea id="solution" value={attempt} onChange={e=>{setAttempt(e.target.value);setShowChecks(false);}} placeholder="Describe your approach or write pseudocode..." className="mt-3 min-h-64 w-full resize-y rounded-2xl border border-white/10 bg-[#09090d] p-4 font-mono text-xs leading-6 text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-400/50"/><div className="mt-3 flex flex-wrap gap-3"><button onClick={()=>setShowChecks(true)} disabled={!attempt.trim()} className="rounded-xl bg-violet-500 px-4 py-3 text-xs font-semibold hover:bg-violet-400 disabled:opacity-40">Review approach <ArrowRight className="ml-1 inline h-4 w-4"/></button><button onClick={()=>{setAttempt("");setShowChecks(false);}} className="rounded-xl border border-white/10 px-4 py-3 text-xs text-zinc-300 hover:bg-white/[0.05]"><RotateCcw className="mr-1 inline h-3.5 w-3.5"/> Reset</button></div>
            {showChecks && <div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-400/[0.06] p-4"><p className="text-sm font-semibold text-violet-200"><CheckCircle2 className="mr-2 inline h-4 w-4"/> Self-review checklist</p><ul className="mt-3 space-y-2 text-xs leading-5 text-zinc-400"><li>• Does your approach avoid reusing the same index?</li><li>• Can you explain the time and space complexity?</li><li>• Does it handle negative values and repeated numbers?</li></ul><p className="mt-3 text-[10px] text-zinc-500">This preview does not execute code or grade submissions.</p></div>}
            <div className="mt-6 rounded-xl border border-amber-300/10 bg-amber-300/[0.04] p-4"><p className="text-[10px] font-semibold tracking-wider text-amber-200">CAPABILITY STATUS</p><p className="mt-2 text-xs leading-5 text-zinc-500">Interactive prompt, hint and self-review are available. Secure code execution, test-case evaluation, timers and saved attempts are planned.</p></div>
          </div>
        </section>
      </div>
    </section>
  </main>;
}

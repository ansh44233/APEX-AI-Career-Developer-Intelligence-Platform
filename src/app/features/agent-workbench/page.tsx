"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Loader2, Send, ShieldCheck, Sparkles } from "lucide-react";

const skills = [
  { slug: "interview-prep", name: "Interview Prep", description: "Practise technical and behavioural interviews." },
  { slug: "coding-practice", name: "Coding Practice", description: "Learn algorithms, hints and debugging." },
  { slug: "system-design", name: "System Design", description: "Explore architecture and engineering trade-offs." },
  { slug: "project-review", name: "Project Review", description: "Get guidance on evidence-based code reviews." },
  { slug: "resume-coach", name: "Resume Coach", description: "Improve truthful resume content." },
] as const;

export default function AgentWorkbenchPage() {
  const [skill, setSkill] = useState<(typeof skills)[number]["slug"]>("interview-prep");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError("");
    setReply("");
    try {
      const response = await fetch("/api/agent/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, message: message.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The request failed.");
      setReply(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
      <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Dashboard</Link>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <Link href="/features/apex-skills" className="text-xs text-zinc-400 hover:text-white">Skills library</Link>
    </header>
    <section className="mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-8">
      <div className="max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><Sparkles className="h-4 w-4"/> APEX AGENT RUNTIME</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Your skills.<br/><span className="text-violet-300">Now conversational.</span></h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">Choose a published APEX skill and send a single request to the configured AI provider. This first runtime is text-only and has no tools or repository access.</p>
      </div>

      <div className="mt-9 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <label htmlFor="apex-skill" className="text-xs font-semibold text-zinc-300">Choose a skill</label>
          <select id="apex-skill" value={skill} onChange={(event) => setSkill(event.target.value as typeof skill)} className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-violet-400">
            {skills.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
          <p className="mt-3 text-xs leading-5 text-zinc-500">{skills.find((item) => item.slug === skill)?.description}</p>
          <div className="mt-6 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">
            <ShieldCheck className="h-4 w-4 text-emerald-200"/>
            <p className="mt-2 text-xs font-semibold text-emerald-100">Bounded execution</p>
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">No tools, shell, file access, browser actions, code execution or automatic changes. Requests are sent to the server-configured AI provider.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
          <label htmlFor="apex-message" className="text-xs font-semibold text-zinc-300">What do you want to work on?</label>
          <textarea id="apex-message" value={message} onChange={(event) => setMessage(event.target.value.slice(0, 5000))} rows={7} placeholder="Describe your question or paste the relevant code / answer. Avoid passwords, API keys or private personal data." className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-violet-400"/>
          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-600"><span>Single-turn request · max 5,000 characters</span><span>{message.length}/5000</span></div>
          <button onClick={submit} disabled={!message.trim() || loading} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}{loading ? "Thinking..." : "Send to APEX"}</button>
          {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.04] p-3 text-xs text-rose-200">{error}</p>}
          {reply && <div className="mt-6 rounded-2xl border border-violet-300/15 bg-violet-300/[0.035] p-4"><p className="flex items-center gap-2 text-xs font-semibold text-violet-200"><Bot className="h-4 w-4"/> APEX response</p><div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-200">{reply}</div></div>}
        </section>
      </div>
      <p className="mt-6 text-[11px] leading-5 text-zinc-600">Do not submit secrets or sensitive personal information. Provider requests may be subject to that provider's data handling terms. This page does not save conversations. Availability requires authentication and server-side AI provider configuration.</p>
    </section>
  </main>;
}

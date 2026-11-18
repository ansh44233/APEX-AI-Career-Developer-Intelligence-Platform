"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Play, ShieldCheck, Wrench } from "lucide-react";

type ToolResult = { toolId: string; result: { characters?: number; words?: number; nonEmptyLines?: number; matchedTerms?: string[]; matchCount?: number; vocabularySize?: number } };

const tools = [
  { id: "text-inspector", name: "Text Inspector", description: "Count words, characters and non-empty lines." },
  { id: "skill-term-extractor", name: "Skill Term Extractor", description: "Find terms from APEX's fixed developer-skill vocabulary." },
] as const;

export function AgentToolsPanel() {
  const [toolId, setToolId] = useState<(typeof tools)[number]["id"]>("text-inspector");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runTool() {
    if (loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/agent/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, input, approved: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Tool execution failed.");
      setResult(data.execution);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tool execution failed.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="mt-6 rounded-3xl border border-violet-300/15 bg-[#111119] p-5 sm:p-6">
    <div className="flex items-center gap-2 text-violet-200"><Wrench className="h-4 w-4"/><p className="text-xs font-semibold tracking-[0.16em]">CONTROLLED TOOLBOX</p></div>
    <h2 className="mt-3 text-xl font-semibold">Run a tool with your approval</h2>
    <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-400">These tools run only after you click Run. They process the text you enter and do not send it to the AI provider or save it to your conversations.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
      <label className="text-xs text-zinc-400">Tool
        <select value={toolId} onChange={(event) => { setToolId(event.target.value as typeof toolId); setResult(null); }} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white">
          {tools.map((tool) => <option key={tool.id} value={tool.id}>{tool.name}</option>)}
        </select>
        <span className="mt-2 block text-[11px] leading-5 text-zinc-500">{tools.find((tool) => tool.id === toolId)?.description}</span>
      </label>
      <label className="text-xs text-zinc-400">Text to process
        <textarea value={input} maxLength={5000} onChange={(event) => setInput(event.target.value)} rows={4} placeholder="Paste non-sensitive text here (maximum 5,000 characters)." className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-violet-400"/>
        <span className="mt-1 block text-right text-[10px] text-zinc-600">{input.length}/5,000</span>
      </label>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-[10px] text-emerald-200"><ShieldCheck className="h-3.5 w-3.5"/> Local, deterministic, no external side effects</span>
      <button onClick={() => void runTool()} disabled={loading || !input.trim()} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Play className="h-4 w-4"/>}Run tool</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/15 p-3 text-xs text-rose-200">{error}</p>}
    {result && <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-emerald-100"><CheckCircle2 className="h-4 w-4"/> Execution result</p>
      {result.toolId === "text-inspector" ? <div className="mt-3 grid grid-cols-3 gap-2">{[["Words", result.result.words], ["Characters", result.result.characters], ["Non-empty lines", result.result.nonEmptyLines]].map(([label, value]) => <div key={label} className="rounded-xl bg-black/20 p-3"><p className="text-[10px] text-zinc-500">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p></div>)}</div> : <div className="mt-3"><p className="text-sm text-white">{result.result.matchCount} matching terms <span className="text-xs text-zinc-500">of {result.result.vocabularySize} known terms</span></p><p className="mt-2 text-xs leading-6 text-zinc-300">{result.result.matchedTerms?.join(" · ") || "No terms from the fixed vocabulary were detected."}</p></div>}
      <p className="mt-3 text-[10px] text-zinc-600">Result is not persisted or independently verified.</p>
    </div>}
  </section>;
}

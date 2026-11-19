"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowUpRight, Bot, BriefcaseBusiness, Check, ChevronDown,
  Code2, FileText, Loader2, MessageSquarePlus, Send, ShieldCheck,
  Sparkles, Trash2, WandSparkles, BrainCircuit,
} from "lucide-react";
import { AgentToolsPanel } from "@/components/agent-tools-panel";
import { GitHubRepositoryIntelligence } from "@/components/github-repository-intelligence";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

const skills = [
  { slug: "career-copilot", name: "Career Copilot", description: "Turn your goals and preparation progress into a clear next-step plan.", icon: BriefcaseBusiness, prompts: ["Help me make a 4-week plan for my target role.", "Review my preparation priorities and tell me what to do next.", "Help me compare my current skills with a job description."] },
  { slug: "interview-prep", name: "Interview Coach", description: "Run realistic practice, ask follow-ups and improve your answers.", icon: BrainCircuit, prompts: ["Start a behavioural mock interview for a software engineer.", "Ask me a medium-difficulty technical interview question.", "Help me improve my answer using the STAR structure."] },
  { slug: "coding-practice", name: "Coding Mentor", description: "Work through algorithms, debugging and problem-solving.", icon: Code2, prompts: ["Give me a medium array problem. Don't reveal the solution yet.", "Review my approach and point out edge cases.", "Teach me sliding window with a worked example."] },
  { slug: "system-design", name: "System Design", description: "Practise architecture, APIs, data models and trade-offs.", icon: WandSparkles, prompts: ["Walk me through designing a URL shortener.", "Ask me system-design questions one at a time.", "Review this architecture and challenge my trade-offs."] },
  { slug: "project-review", name: "Project Reviewer", description: "Explain your project clearly and identify improvements.", icon: ShieldCheck, prompts: ["Help me prepare a 2-minute explanation of my project.", "Ask me difficult questions about my technical decisions.", "Review this project description for clarity and evidence."] },
  { slug: "resume-coach", name: "Resume Coach", description: "Make your experience clearer and more relevant without inventing claims.", icon: FileText, prompts: ["Review these resume bullets for a software engineering role.", "Help me tailor my resume to this job description.", "Make this project bullet more specific without adding fake metrics."] },
] as const;

type SkillSlug = (typeof skills)[number]["slug"];
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string };
type Conversation = { id: string; skillSlug: SkillSlug; title: string; updatedAt: string; _count?: { messages: number } };

export default function AgentWorkbenchPage() {
  const [skill, setSkill] = useState<SkillSlug>("career-copilot");
  const [conversationId, setConversationId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [shareCareerContext, setShareCareerContext] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showTools, setShowTools] = useState(false);
  const [showRepository, setShowRepository] = useState(false);

  const selectedSkill = skills.find((item) => item.slug === skill) ?? skills[0];

  async function loadConversations() {
    setHistoryLoading(true);
    try {
      const response = await fetch("/api/agent/conversations", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load conversations.");
      setConversations(data.conversations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load conversation history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => { void loadConversations(); }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("skill");
    const prompt = params.get("prompt");
    if (requested && skills.some((item) => item.slug === requested)) setSkill(requested as SkillSlug);
    if (prompt) setMessage(prompt.slice(0, 5000));
  }, []);

  async function openConversation(id: string) {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/agent/conversations/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not open conversation.");
      setConversationId(data.conversation.id);
      setSkill(data.conversation.skillSlug);
      setMessages(data.conversation.messages ?? []);
      setShareCareerContext(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open conversation.");
    } finally {
      setLoading(false);
    }
  }

  function newConversation(nextSkill: SkillSlug = skill) {
    setConversationId("");
    setMessages([]);
    setMessage("");
    setError("");
    setShareCareerContext(false);
    setSkill(nextSkill);
  }

  async function deleteConversation(id: string) {
    if (!window.confirm("Delete this conversation and all its messages? This cannot be undone.")) return;
    setError("");
    try {
      const response = await fetch(`/api/agent/conversations/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not delete conversation.");
      setConversations((current) => current.filter((item) => item.id !== id));
      if (conversationId === id) newConversation();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete conversation.");
    }
  }

  async function submit() {
    if (!message.trim() || loading) return;
    setLoading(true);
    setError("");
    const content = message.trim();
    const includeCareerContext = skill === "career-copilot" && shareCareerContext;
    setShareCareerContext(false);
    setMessage("");
    try {
      let activeId = conversationId;
      if (!activeId) {
        const createResponse = await fetch("/api/agent/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skill }),
        });
        const created = await createResponse.json();
        if (!createResponse.ok) throw new Error(created.error ?? "Could not start a conversation.");
        activeId = created.conversation.id;
        setConversationId(activeId);
      }

      const response = await fetch(`/api/agent/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, includeCareerContext }),
      });
      const data = await response.json();
      if (!response.ok) {
        await openConversation(activeId);
        throw new Error(data.error ?? "The request failed.");
      }
      setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "user", content, createdAt: new Date().toISOString() }, data.message]);
      void loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return <ApexWorkspaceShell><main className="min-h-screen bg-[#09090d] text-white">
    <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#09090d]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-7">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-medium text-[#a1a1aa] transition hover:text-white"><ArrowLeft className="h-4 w-4"/> Dashboard</Link>
        <Link href="/dashboard" className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#a78bfa] text-sm font-black text-[#11150d]">A</span><span className="text-sm font-black tracking-[0.14em]">APEX<span className="text-[#a78bfa]">.</span></span></Link>
        <span className="hidden items-center gap-2 rounded-full border border-[#a78bfa]/20 bg-[#a78bfa]/[0.06] px-3 py-1.5 text-[10px] font-semibold text-[#c4b5fd] sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa]"/> CAREER COPILOT</span>
      </div>
    </header>

    <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 lg:py-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#a78bfa]"><Sparkles className="h-4 w-4"/> YOUR AI WORKSPACE</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Meet your career copilot.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#a1a1aa]">Choose a specialist, ask a question and turn the answer into your next action.</p></div>
        <button onClick={() => newConversation()} className="inline-flex items-center gap-2 rounded-xl bg-[#a78bfa] px-4 py-3 text-xs font-bold text-[#11150d] transition hover:bg-[#ddd6fe]"><MessageSquarePlus className="h-4 w-4"/> New chat</button>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[285px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-2xl border border-white/[0.08] bg-[#151521] p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold text-white">Choose your specialist</h2><span className="text-[10px] text-[#717184]">6 skills</span></div>
            <div className="space-y-1.5">
              {skills.map((item) => { const Icon = item.icon; const active = skill === item.slug; return <button key={item.slug} onClick={() => newConversation(item.slug)} aria-pressed={active} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-[#a78bfa]/25 bg-[#a78bfa]/[0.08]" : "border-transparent hover:border-white/[0.07] hover:bg-white/[0.035]"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? "bg-[#a78bfa]/15 text-[#c4b5fd]" : "bg-white/[0.05] text-[#a1a1aa]"}`}><Icon className="h-4 w-4"/></span><span className="min-w-0 flex-1"><span className={`block text-xs font-semibold ${active ? "text-[#c4b5fd]" : "text-[#e1e8dc]"}`}>{item.name}</span><span className="mt-1 block text-[10px] leading-4 text-[#9292a0]">{item.description}</span></span>{active && <Check className="h-4 w-4 shrink-0 text-[#a78bfa]"/>}</button>; })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.08] bg-[#151521] p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xs font-semibold text-white">Recent conversations</h2><span className="rounded-full bg-white/[0.06] px-2 py-1 text-[10px] text-[#a1a1aa]">{conversations.length}</span></div>
            <div className="max-h-[340px] space-y-1.5 overflow-y-auto">
              {historyLoading && <p className="py-4 text-xs text-[#9292a0]">Loading your chats…</p>}
              {!historyLoading && conversations.length === 0 && <p className="rounded-xl bg-white/[0.025] p-3 text-xs leading-5 text-[#9292a0]">Your saved conversations will appear here.</p>}
              {conversations.map((item) => <div key={item.id} className={`group flex items-center gap-2 rounded-xl border p-2 ${conversationId === item.id ? "border-[#a78bfa]/20 bg-[#a78bfa]/[0.06]" : "border-transparent hover:bg-white/[0.035]"}`}><button onClick={() => void openConversation(item.id)} className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-medium text-[#e1e8dc]">{item.title}</span><span className="mt-1 block truncate text-[10px] text-[#717184]">{skills.find((entry) => entry.slug === item.skillSlug)?.name ?? item.skillSlug} · {item._count?.messages ?? "—"} messages</span></button><button onClick={() => void deleteConversation(item.id)} aria-label="Delete conversation" className="rounded-lg p-2 text-[#717184] opacity-70 transition hover:bg-rose-400/10 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5"/></button></div>)}
            </div>
          </section>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151521]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-[#a78bfa]/20 bg-[#a78bfa]/10 text-[#c4b5fd]"><selectedSkill.icon className="h-5 w-5"/></span><div><p className="text-sm font-semibold text-white">{selectedSkill.name}</p><p className="mt-1 text-[10px] text-[#9292a0]">{conversationId ? "Saved conversation · private to your account" : "New conversation · ready when you are"}</p></div></div>
            {conversationId && <span className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[10px] text-[#9292a0]">History saved</span>}
          </div>

          <div className="min-h-[430px] space-y-5 px-4 py-5 sm:px-6">
            {messages.length === 0 && <div className="mx-auto max-w-2xl py-8 sm:py-12">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#a78bfa]/20 bg-[#a78bfa]/[0.08] text-[#c4b5fd]"><Bot className="h-7 w-7"/></div>
              <h2 className="mt-5 text-center text-xl font-semibold text-white">What are we working on?</h2><p className="mx-auto mt-2 max-w-lg text-center text-sm leading-6 text-[#9292a0]">{selectedSkill.description} Pick a starter prompt or write your own message.</p>
              <div className="mt-7 grid gap-2 sm:grid-cols-2">{selectedSkill.prompts.map((prompt) => <button key={prompt} onClick={() => setMessage(prompt)} className="group flex items-start gap-3 rounded-xl border border-white/[0.08] bg-[#111119] p-3 text-left transition hover:border-[#a78bfa]/25 hover:bg-[#1a1930]"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#a78bfa]"/><span className="text-xs leading-5 text-[#cbd4c3]">{prompt}</span><ArrowUpRight className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-[#717184] opacity-0 transition group-hover:opacity-100"/></button>)}</div>
            </div>}
            {messages.map((item) => <div key={item.id} className={`flex gap-3 ${item.role === "user" ? "justify-end" : "justify-start"}`}>{item.role === "assistant" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#a78bfa]/10 text-[#c4b5fd]"><Bot className="h-4 w-4"/></span>}<div className={`max-w-[88%] rounded-2xl px-4 py-3 ${item.role === "user" ? "border border-[#a78bfa]/15 bg-[#a78bfa]/[0.09] text-[#edf8df]" : "border border-white/[0.07] bg-[#111119] text-[#e1e8dc]"}`}><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9292a0]">{item.role === "user" ? "You" : "APEX assistant"}</p><div className="whitespace-pre-wrap break-words text-sm leading-7">{item.content}</div></div>{item.role === "user" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-xs font-bold text-[#dce3d4]">YOU</span>}</div>)}
            {loading && <div className="flex items-center gap-3 text-xs text-[#c4b5fd]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#a78bfa]/10"><Loader2 className="h-4 w-4 animate-spin"/></span> APEX is thinking through your request…</div>}
          </div>

          {error && <p role="alert" className="mx-4 mb-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.05] p-3 text-xs text-rose-200 sm:mx-6">{error}</p>}
          <div className="border-t border-white/[0.07] bg-[#111119] p-4 sm:p-5">
            {skill === "career-copilot" && <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-xl border border-[#a78bfa]/15 bg-[#a78bfa]/[0.045] p-3"><input type="checkbox" checked={shareCareerContext} onChange={(event) => setShareCareerContext(event.target.checked)} className="mt-0.5 accent-[#a78bfa]"/><span><span className="block text-xs font-semibold text-[#c4b5fd]">Use my saved APEX career data</span><span className="mt-1 block text-[10px] leading-5 text-[#9292a0]">Optional and off by default. A limited snapshot of your goals, applications and preparation activity is sent to the configured AI provider for this message only.</span></span></label>}
            <label htmlFor="apex-message" className="sr-only">Your message</label>
            <div className="flex items-end gap-2 rounded-2xl border border-white/[0.10] bg-[#09090d] p-2 focus-within:border-[#a78bfa]/40"><textarea id="apex-message" value={message} onChange={(event) => setMessage(event.target.value.slice(0, 5000))} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit(); } }} rows={3} placeholder="Ask a question, share your answer or describe what you want to build…" className="max-h-40 min-h-[72px] flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-[#717184]"/><button onClick={() => void submit()} disabled={!message.trim() || loading} aria-label="Send message" className="mb-1 inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#a78bfa] px-3 text-xs font-bold text-[#11150d] transition hover:bg-[#ddd6fe] disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4"/><span className="hidden sm:inline">Send</span></button></div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] text-[#717184]">Enter to send · Shift + Enter for a new line · 5,000 character limit</span><span className="text-[10px] text-[#717184]">{message.length}/5,000</span></div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-[#151521] p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#a78bfa]"/><div><p className="text-xs font-semibold text-white">Your conversations stay yours</p><p className="mt-1 text-[11px] leading-5 text-[#9292a0]">Chats are scoped to your account. Delete a conversation to remove its stored messages.</p></div></div>
        <div className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-[#151521] p-4"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#a78bfa]"/><div><p className="text-xs font-semibold text-white">AI provider required</p><p className="mt-1 text-[11px] leading-5 text-[#9292a0]">Live model replies require AI_BASE_URL, AI_API_KEY and AI_MODEL in the server environment. Messages are sent to that provider.</p></div></div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151521]">
        <button onClick={() => setShowTools((value) => !value)} aria-expanded={showTools} className="flex w-full items-center justify-between px-5 py-4 text-left"><span className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[#a78bfa]"/><span><span className="block text-xs font-semibold text-white">Controlled AI tools</span><span className="mt-1 block text-[10px] text-[#9292a0]">Optional text utilities with explicit approval</span></span></span><ChevronDown className={`h-4 w-4 text-[#9292a0] transition ${showTools ? "rotate-180" : ""}`}/></button>
        {showTools && <div className="border-t border-white/[0.07] p-4"><AgentToolsPanel/></div>}
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#151521]">
        <button onClick={() => setShowRepository((value) => !value)} aria-expanded={showRepository} className="flex w-full items-center justify-between px-5 py-4 text-left"><span className="flex items-center gap-3"><Code2 className="h-4 w-4 text-[#a78bfa]"/><span><span className="block text-xs font-semibold text-white">GitHub project review</span><span className="mt-1 block text-[10px] text-[#9292a0]">Inspect public repositories and prepare project explanations</span></span></span><ChevronDown className={`h-4 w-4 text-[#9292a0] transition ${showRepository ? "rotate-180" : ""}`}/></button>
        {showRepository && <div className="border-t border-white/[0.07] p-4"><GitHubRepositoryIntelligence/></div>}
      </div>
      <p className="mt-5 text-center text-[10px] leading-5 text-[#717184]">APEX provides coaching suggestions, not guaranteed interview outcomes. Verify important advice and never submit passwords, API keys or sensitive personal data.</p>
    </section>
  </main></ApexWorkspaceShell>;
}

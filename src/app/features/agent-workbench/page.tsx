"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Loader2, MessageSquarePlus, Send, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

const skills = [
  { slug: "interview-prep", name: "Interview Prep", description: "Practise technical and behavioural interviews." },
  { slug: "coding-practice", name: "Coding Practice", description: "Learn algorithms, hints and debugging." },
  { slug: "system-design", name: "System Design", description: "Explore architecture and engineering trade-offs." },
  { slug: "project-review", name: "Project Review", description: "Get guidance on evidence-based code reviews." },
  { slug: "resume-coach", name: "Resume Coach", description: "Improve truthful resume content." },
] as const;

type SkillSlug = (typeof skills)[number]["slug"];
type ChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string };
type Conversation = { id: string; skillSlug: SkillSlug; title: string; updatedAt: string; _count?: { messages: number } };

export default function AgentWorkbenchPage() {
  const [skill, setSkill] = useState<SkillSlug>("interview-prep");
  const [conversationId, setConversationId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open conversation.");
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setConversationId("");
    setMessages([]);
    setMessage("");
    setError("");
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
        body: JSON.stringify({ message: content }),
      });
      const data = await response.json();
      if (!response.ok) {
        // The server may have saved the learner's turn even if the model provider failed.
        await openConversation(activeId);
        throw new Error(data.error ?? "The request failed.");
      }
      await openConversation(activeId);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
      <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Dashboard</Link>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <Link href="/features/apex-skills" className="text-xs text-zinc-400 hover:text-white">Skills library</Link>
    </header>

    <section className="mx-auto max-w-7xl px-5 pb-20 pt-5 sm:px-8">
      <div className="mb-8">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><Sparkles className="h-4 w-4"/> APEX AGENT RUNTIME</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Your skills.<br/><span className="text-violet-300">Your ongoing workspace.</span></h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">Continue saved coaching conversations. APEX uses recent messages from the selected conversation as context for the next response.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-white/10 bg-[#111119] p-4">
          <button onClick={newConversation} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-3 py-3 text-xs font-semibold hover:bg-violet-400"><MessageSquarePlus className="h-4 w-4"/> New conversation</button>
          <div className="mt-5 flex items-center justify-between"><p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-500">RECENT CONVERSATIONS</p><span className="text-[10px] text-zinc-600">{conversations.length}</span></div>
          <div className="mt-3 space-y-2">
            {historyLoading && <p className="py-4 text-xs text-zinc-500">Loading history…</p>}
            {!historyLoading && conversations.length === 0 && <p className="py-4 text-xs leading-5 text-zinc-500">No saved conversations yet. Start a new one.</p>}
            {conversations.map((item) => <div key={item.id} className={`group flex items-center gap-2 rounded-xl border p-2.5 ${conversationId === item.id ? "border-violet-300/25 bg-violet-300/[0.07]" : "border-white/[0.06] bg-white/[0.02]"}`}>
              <button onClick={() => void openConversation(item.id)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-medium text-zinc-200">{item.title}</p>
                <p className="mt-1 text-[10px] text-zinc-600">{skills.find((entry) => entry.slug === item.skillSlug)?.name ?? item.skillSlug} · {item._count?.messages ?? "—"} messages</p>
              </button>
              <button onClick={() => void deleteConversation(item.id)} aria-label="Delete conversation" className="rounded-lg p-2 text-zinc-600 hover:bg-rose-400/10 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5"/></button>
            </div>)}
          </div>
        </aside>

        <section className="min-w-0 rounded-3xl border border-white/10 bg-[#111119] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div><p className="text-xs font-semibold text-zinc-200">{conversationId ? "Saved conversation" : "New conversation"}</p><p className="mt-1 text-[10px] text-zinc-500">{conversationId ? "Messages are saved to your account" : "Choose a skill to begin"}</p></div>
            <select aria-label="Choose APEX skill" value={skill} disabled={Boolean(conversationId)} onChange={(event) => setSkill(event.target.value as SkillSlug)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white outline-none focus:border-violet-400 disabled:opacity-60">
              {skills.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          </div>

          <div className="min-h-[340px] space-y-4 py-5">
            {messages.length === 0 && <div className="mx-auto max-w-md py-16 text-center"><Bot className="mx-auto h-8 w-8 text-violet-300"/><p className="mt-4 text-sm font-medium text-zinc-200">What would you like to work on?</p><p className="mt-2 text-xs leading-5 text-zinc-500">{skills.find((item) => item.slug === skill)?.description} Your conversation will be saved when you send the first message.</p></div>}
            {messages.map((item) => <div key={item.id} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[90%] rounded-2xl px-4 py-3 ${item.role === "user" ? "bg-violet-500/20 text-violet-50" : "border border-white/[0.07] bg-black/20 text-zinc-200"}`}><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{item.role === "user" ? "You" : "APEX"}</p><div className="whitespace-pre-wrap break-words text-sm leading-7">{item.content}</div></div></div>)}
            {loading && <div className="flex items-center gap-2 text-xs text-violet-200"><Loader2 className="h-4 w-4 animate-spin"/> APEX is working…</div>}
          </div>

          {error && <p role="alert" className="mb-3 rounded-xl border border-rose-300/15 bg-rose-300/[0.04] p-3 text-xs text-rose-200">{error}</p>}
          <div className="border-t border-white/[0.07] pt-4">
            <label htmlFor="apex-message" className="text-xs font-semibold text-zinc-300">Your message</label>
            <textarea id="apex-message" value={message} onChange={(event) => setMessage(event.target.value.slice(0, 5000))} rows={4} placeholder="Continue the discussion or ask a follow-up. Avoid passwords, API keys or sensitive personal information." className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-violet-400"/>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><span className="text-[10px] text-zinc-600">Max 5,000 characters · Up to 100 messages per conversation</span><button onClick={() => void submit()} disabled={!message.trim() || loading} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-xs font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}Send message</button></div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.025] p-4"><ShieldCheck className="h-4 w-4 text-emerald-200"/><p className="mt-2 text-xs font-semibold text-emerald-100">Private and controllable</p><p className="mt-1 text-[11px] leading-5 text-zinc-500">Only your account can access its conversations. Delete a conversation to remove its stored messages.</p></div>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"><p className="text-xs font-semibold text-zinc-300">Context boundaries</p><p className="mt-1 text-[11px] leading-5 text-zinc-500">The latest 12 messages are sent with each turn. A conversation is capped at 100 messages. This is conversation history, not cross-chat personal memory.</p></div>
      </div>
      <p className="mt-5 text-[10px] leading-5 text-zinc-600">Requires sign-in, PostgreSQL migration 0004, and server-side AI provider configuration. Messages are sent to the configured model provider. Do not submit secrets or sensitive personal data. Provider retention is governed by that provider's terms.</p>
    </section>
  </main>;
}

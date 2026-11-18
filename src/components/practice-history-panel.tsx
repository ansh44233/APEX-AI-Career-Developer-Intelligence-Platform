"use client";

import { FormEvent, useEffect, useState } from "react";
import { Activity, CheckCircle2, Clock3, Plus, RefreshCw, Send } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type PracticeSession = {
  id: string;
  module: string;
  title: string;
  status: "in_progress" | "completed" | "abandoned";
  startedAt: string;
  completedAt: string | null;
  _count?: { attempts: number };
};

type Attempt = {
  id: string;
  prompt: string;
  responseText: string | null;
  score: string | null;
  createdAt: string;
};

const modules = [
  { value: "interview", label: "Interview" },
  { value: "coding", label: "Coding" },
  { value: "system_design", label: "System design" },
  { value: "resume", label: "Resume" },
  { value: "project_defense", label: "Project defense" },
];

export function PracticeHistoryPanel() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [module, setModule] = useState("interview");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [responseText, setResponseText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selected = sessions.find((item) => item.id === selectedId);

  async function loadSessions() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/practice/sessions?limit=30", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load practice history.");
      const rows = data.sessions ?? [];
      setSessions(rows);
      setSelectedId((current) => rows.some((item: PracticeSession) => item.id === current) ? current : rows[0]?.id ?? "");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load practice history.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAttempts(id: string) {
    if (!id) {
      setAttempts([]);
      return;
    }
    try {
      const response = await fetch("/api/practice/sessions/" + id + "/attempts", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load attempts.");
      setAttempts(data.attempts ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load attempts.");
    }
  }

  useEffect(() => {
    if (session) void loadSessions();
    else {
      setSessions([]);
      setSelectedId("");
      setAttempts([]);
    }
  }, [session?.user.id]);

  useEffect(() => {
    void loadAttempts(selectedId);
  }, [selectedId]);

  async function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, title }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create practice session.");
      setTitle("");
      await loadSessions();
      setSelectedId(data.session.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create practice session.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAttempt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || selected.status !== "in_progress") return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/practice/sessions/" + selected.id + "/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, responseText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save attempt.");
      setPrompt("");
      setResponseText("");
      await loadAttempts(selected.id);
      await loadSessions();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save attempt.");
    } finally {
      setSaving(false);
    }
  }

  async function finishSession() {
    if (!selected || selected.status !== "in_progress") return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/practice/sessions/" + selected.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not complete session.");
      await loadSessions();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete session.");
    } finally {
      setSaving(false);
    }
  }

  if (sessionPending) {
    return <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-zinc-500">Checking your account…</div>;
  }

  if (!session) {
    return (
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white"><Activity className="h-4 w-4 text-violet-300" /> Practice history</div>
        <p className="mt-2 text-sm text-zinc-500">Sign in to create practice sessions and keep your attempts saved to your account.</p>
        <a href="/sign-in" className="mt-4 inline-flex rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-semibold text-white">Sign in to continue</a>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">Real account activity</p>
          <h2 className="text-lg font-semibold text-white">Practice history</h2>
        </div>
        <button type="button" onClick={() => void loadSessions()} disabled={loading} aria-label="Refresh practice history" className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></button>
      </div>

      <form onSubmit={createSession} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
        <select value={module} onChange={(event) => setModule(event.target.value)} className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-300">
          {modules.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <input required minLength={1} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Session title" className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400" />
        <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"><Plus className="h-4 w-4" /> Create</button>
      </form>

      {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)]">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Your sessions</p>
          <div className="space-y-2">
            {sessions.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={"w-full rounded-xl border p-3 text-left transition " + (selectedId === item.id ? "border-violet-300/30 bg-violet-400/10" : "border-white/[0.07] bg-black/15 hover:bg-white/[0.04]")}>
                <span className="block text-xs font-medium text-zinc-200">{item.title}</span>
                <span className="mt-1 flex items-center justify-between gap-2 text-[10px] text-zinc-500"><span>{item.module.replaceAll("_", " ")}</span><span>{item._count?.attempts ?? 0} attempts</span></span>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-zinc-500">{item.status === "completed" ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Clock3 className="h-3 w-3" />}{item.status.replaceAll("_", " ")}</span>
              </button>
            ))}
            {!loading && sessions.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-zinc-500">No saved sessions yet.</p>}
          </div>
        </div>

        <div>
          {selected ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-sm font-semibold text-white">{selected.title}</h3><p className="mt-1 text-[10px] text-zinc-500">{new Date(selected.startedAt).toLocaleString()}</p></div>
                {selected.status === "in_progress" && <button type="button" onClick={() => void finishSession()} disabled={saving} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-[11px] font-medium text-emerald-200 hover:bg-emerald-300/10">Complete session</button>}
              </div>
              {selected.status === "in_progress" && (
                <form onSubmit={saveAttempt} className="mb-4 space-y-2 rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <input required maxLength={8000} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Question or task prompt" className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-violet-400" />
                  <textarea maxLength={20000} rows={3} value={responseText} onChange={(event) => setResponseText(event.target.value)} placeholder="Your answer / solution notes (optional)" className="w-full resize-y rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-violet-400" />
                  <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Send className="h-3.5 w-3.5" /> Save attempt</button>
                </form>
              )}
              <div className="space-y-2">
                {attempts.map((attempt) => (
                  <article key={attempt.id} className="rounded-xl border border-white/[0.07] bg-black/15 p-3">
                    <p className="text-xs font-medium text-zinc-200">{attempt.prompt}</p>
                    {attempt.responseText && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-400">{attempt.responseText}</p>}
                    <p className="mt-2 text-[10px] text-zinc-600">{new Date(attempt.createdAt).toLocaleString()}</p>
                  </article>
                ))}
                {attempts.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-zinc-500">No attempts saved in this session yet.</p>}
              </div>
            </>
          ) : <p className="rounded-xl border border-dashed border-white/10 p-5 text-xs text-zinc-500">Create a session or select one to view its attempts.</p>}
        </div>
      </div>
      <p className="mt-4 text-[10px] leading-4 text-zinc-600">Your practice prompts and notes are saved to your account. This feature records work; it does not yet run code or generate AI feedback.</p>
    </section>
  );
}

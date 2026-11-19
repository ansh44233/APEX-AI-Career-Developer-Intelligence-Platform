"use client";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BrainCircuit, BriefcaseBusiness, CheckCircle2, Compass, GitCompareArrows, Layers3, RefreshCw, Target, TrendingUp } from "lucide-react";

type SkillNode = {
  skillKey: string;
  assessment: { rating: number; assessedAt: string; source: string } | null;
  roadmap: { tasks: number; completed: number; open: number };
  practice: { evaluatedAttempts: number; latestRubricAverage: number | null; rubricDimensions: Array<{ key: string; average: number; count: number }> };
  modules: string[];
};
type GoalGraph = {
  goal: { id: string; targetRole: string; targetCompany: string | null; targetDate: string | null };
  nodes: { skills: SkillNode[]; practice: { sessions: number; attempts: number; evaluatedAttempts: number }; applications: { total: number; byStatus: Record<string, number> }; claims: Array<{ claimType: string; claimText: string; supportingExcerpt: string; capture: { sourceTitle: string; sourceUrl: string } }> };
};
type GraphData = { goals: GoalGraph[]; methodology: { links: string; mapping: string; limits: string } };
type Track = { id: string; label: string; skills: Array<{ key: string; label: string }> };
const common = [
  { key: "problem_solving", label: "Problem solving" },
  { key: "data_structures_algorithms", label: "Data structures & algorithms" },
  { key: "communication", label: "Technical communication" },
  { key: "core_cs", label: "Core computer science" },
];
const tracks: Track[] = [
  { id: "frontend", label: "Frontend engineering", skills: [...common,{key:"javascript_typescript",label:"JavaScript / TypeScript"},{key:"react",label:"React and component design"},{key:"web_accessibility",label:"Web accessibility"},{key:"web_performance",label:"Web performance"}] },
  { id: "backend", label: "Backend engineering", skills: [...common,{key:"api_design",label:"API design"},{key:"databases",label:"Databases and data modelling"},{key:"system_design",label:"System design"},{key:"security",label:"Application security"}] },
  { id: "fullstack", label: "Full-stack engineering", skills: [...common,{key:"javascript_typescript",label:"JavaScript / TypeScript"},{key:"react",label:"Frontend frameworks"},{key:"api_design",label:"API design"},{key:"databases",label:"Databases"},{key:"deployment",label:"Deployment fundamentals"}] },
  { id: "data", label: "Data engineering", skills: [...common,{key:"sql",label:"SQL"},{key:"data_modeling",label:"Data modelling"},{key:"python",label:"Python"},{key:"distributed_systems",label:"Distributed data systems"}] },
  { id: "devops", label: "DevOps / platform engineering", skills: [...common,{key:"linux",label:"Linux fundamentals"},{key:"networking",label:"Networking"},{key:"cloud",label:"Cloud infrastructure"},{key:"ci_cd",label:"CI / CD and automation"},{key:"observability",label:"Monitoring and observability"}] },
  { id: "mobile", label: "Mobile engineering", skills: [...common,{key:"mobile_platforms",label:"Mobile platform fundamentals"},{key:"javascript_typescript",label:"JavaScript / TypeScript"},{key:"api_integration",label:"API integration"},{key:"testing",label:"Testing fundamentals"}] },
  { id: "general", label: "Software engineering", skills: [...common,{key:"programming_fundamentals",label:"Programming fundamentals"},{key:"testing",label:"Testing fundamentals"},{key:"system_design",label:"System design"},{key:"version_control",label:"Version control and collaboration"}] },
];

export default function CareerTwinPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [goalId, setGoalId] = useState("");
  const [alternativeId, setAlternativeId] = useState("backend");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const [savedExperiments, setSavedExperiments] = useState<Record<string, string>>({});
  const [savingExperiment, setSavingExperiment] = useState("");
  const [experimentNotice, setExperimentNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/graph", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load your saved career profile.");
      setData(payload);
      setGoalId(current => current && payload.goals.some((item: GoalGraph) => item.goal.id === current) ? current : payload.goals[0]?.goal.id ?? "");
      const actionResponse = await fetch("/api/intelligence/recommendation-actions", { cache: "no-store" });
      if (actionResponse.ok) {
        const actionPayload = await actionResponse.json();
        const tracked: Record<string, string> = {};
        for (const action of actionPayload.actions ?? []) {
          if (typeof action.sourceKey === "string" && action.sourceKey.startsWith("skill-twin-")) tracked[action.sourceKey] = action.status;
        }
        setSavedExperiments(tracked);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Career Twin is unavailable.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const current = data?.goals.find(item => item.goal.id === goalId) ?? data?.goals[0] ?? null;
  const alternative = tracks.find(track => track.id === alternativeId) ?? tracks[0];
  const profile = useMemo(() => {
    if (!current) return null;
    const byKey = new Map(current.nodes.skills.map(skill => [skill.skillKey, skill]));
    const currentTrack = tracks.find(track => {
      const normalized = current.goal.targetRole.toLowerCase();
      return track.id === "frontend" ? /frontend|front-end|ui engineer|web developer/.test(normalized)
        : track.id === "backend" ? /backend|back-end|server engineer|api developer/.test(normalized)
        : track.id === "fullstack" ? /full.?stack/.test(normalized)
        : track.id === "data" ? /data engineer|analytics engineer|data platform/.test(normalized)
        : track.id === "devops" ? /devops|platform engineer|site reliability|sre|cloud engineer/.test(normalized)
        : track.id === "mobile" ? /mobile|ios developer|android developer|react native/.test(normalized)
        : false;
    }) ?? tracks[6];
    const build = (track: Track) => track.skills.map(skill => {
      const saved = byKey.get(skill.key);
      return { ...skill, assessment: saved?.assessment ?? null, completed: saved?.roadmap.completed ?? 0, open: saved?.roadmap.open ?? 0, evaluatedAttempts: saved?.practice.evaluatedAttempts ?? 0, rubric: saved?.practice.latestRubricAverage ?? null, modules: saved?.modules ?? [] };
    });
    const currentSkills = build(currentTrack);
    const alternativeSkills = build(alternative);
    const assessed = (items: ReturnType<typeof build>) => items.filter(item => item.assessment !== null).length;
    const low = (items: ReturnType<typeof build>) => items.filter(item => item.assessment && item.assessment.rating <= 2);
    const missing = (items: ReturnType<typeof build>) => items.filter(item => !item.assessment);
    const overlap = currentSkills.filter(item => alternativeSkills.some(other => other.key === item.key));
    return {
      currentTrack, currentSkills, alternativeSkills,
      currentCoverage: Math.round(assessed(currentSkills) / currentSkills.length * 100),
      alternativeCoverage: Math.round(assessed(alternativeSkills) / alternativeSkills.length * 100),
      overlap: overlap.length,
      sharedCount: currentSkills.filter(item => alternativeSkills.some(other => other.key === item.key)).length,
      currentLow: low(currentSkills), alternativeLow: low(alternativeSkills),
      currentMissing: missing(currentSkills), alternativeMissing: missing(alternativeSkills),
      currentRecorded: assessed(currentSkills), alternativeRecorded: assessed(alternativeSkills),
    };
  }, [current, alternative]);

  const copilotPrompt = current && profile ? "Help me evaluate my Career Twin scenario. My saved goal is " + current.goal.targetRole + (current.goal.targetCompany ? " at " + current.goal.targetCompany : "") + ". I am comparing it with " + alternative.label + ". Compare transferable skills, unassessed areas, low self-ratings, approved evidence and practice history from my saved profile. Do not treat self-ratings as objective proficiency or predict hiring outcomes. Help me decide what small project or learning experiment could test this direction." : "";
  const experiments = profile ? [
    ...profile.alternativeMissing.slice(0, 3).map(item => ({ ...item, kind: "unassessed" as const, rating: null as number | null })),
    ...profile.alternativeLow.slice(0, 2).map(item => ({ ...item, kind: "low_rating" as const, rating: item.assessment!.rating })),
  ] : [];
  const saveExperiment = async (item: (typeof experiments)[number]) => {
    if (!current) return;
    const sourceKey = "skill-twin-" + current.goal.id + "-" + alternative.id + "-" + item.key;
    setSavingExperiment(item.key); setExperimentNotice("");
    try {
      const reason = item.kind === "unassessed"
        ? "Explore " + item.label + " with one small beginner project or practice task, then record what you learned. This is an experiment, not proof that the skill is missing."
        : "Revisit " + item.label + " after one focused practice attempt. The current " + item.rating + "/5 rating is self-reported and should be reassessed only with new evidence.";
      const response = await fetch("/api/intelligence/recommendation-actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceKey, title: "Career experiment · " + item.label, reason, href: "/features/readiness-engine", basis: "career_twin", action: "accepted", goalId: current.goal.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save this experiment.");
      setSavedExperiments(previous => ({ ...previous, [sourceKey]: payload.action?.status || "accepted" }));
      setExperimentNotice("Experiment saved to your Career Action Tracker.");
    } catch (cause) {
      setExperimentNotice(cause instanceof Error ? cause.message : "Could not save this experiment.");
    } finally { setSavingExperiment(""); }
  };

  return <ApexWorkspaceShell><div className="min-h-screen text-[var(--text)]">
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#c5f36a]"><BrainCircuit className="h-4 w-4"/> PHASE 46 · CAREER TWIN</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Explore your <span className="text-[#c5f36a]">Career Twin.</span></h1>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">A structured view of your saved career direction, recorded skill signals, roadmap and practice history. Compare an alternative path before making a real-world commitment.</p>
      </div>

      <section className="mb-6 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-6">
        <div className="flex items-center gap-2"><Target className="h-4 w-4 text-[#c5f36a]"/><h2 className="text-sm font-semibold">Choose a direction to explore</h2></div>
        {loading && <p className="mt-4 text-xs text-[var(--muted)]">Building your career profile from saved records…</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
        {!loading && data && data.goals.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] p-4"><p className="text-sm font-medium">No active career goal found</p><p className="mt-1 text-xs text-[var(--muted)]">Create a career goal and add a few skill assessments or practice sessions to build your Career Twin.</p><a href="/dashboard" className="mt-3 inline-flex text-xs text-[#c5f36a]">Open dashboard <ArrowUpRight className="ml-1 h-3 w-3"/></a></div>}
        {data && data.goals.length > 0 && <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-[11px] text-[var(--muted)]">Saved career direction
            <select value={goalId} onChange={event => setGoalId(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-xs text-[var(--text)]">{data.goals.map(item => <option key={item.goal.id} value={item.goal.id}>{item.goal.targetRole}{item.goal.targetCompany ? " · " + item.goal.targetCompany : ""}</option>)}</select>
          </label>
          <label className="text-[11px] text-[var(--muted)]">Alternative direction
            <select value={alternativeId} onChange={event => setAlternativeId(event.target.value)} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] px-3 py-3 text-xs text-[var(--text)]">{tracks.map(track => <option key={track.id} value={track.id}>{track.label}</option>)}</select>
          </label>
        </div>}
      </section>

      {current && profile && <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric icon={BriefcaseBusiness} label="Saved direction" value={current.goal.targetRole} note={current.goal.targetCompany || "No target company saved"}/>
          <Metric icon={Layers3} label="Linked practice" value={current.nodes.practice.sessions + " sessions"} note={current.nodes.practice.attempts + " attempts · " + current.nodes.practice.evaluatedAttempts + " self-evaluations"}/>
          <Metric icon={CheckCircle2} label="Linked applications" value={current.nodes.applications.total} note="Saved against this career goal"/>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <DirectionCard title="Current direction" subtitle={profile.currentTrack.label} coverage={profile.currentCoverage} assessed={profile.currentRecorded} total={profile.currentSkills.length} low={profile.currentLow.length} skills={profile.currentSkills}/>
          <DirectionCard title="Alternative direction" subtitle={alternative.label} coverage={profile.alternativeCoverage} assessed={profile.alternativeRecorded} total={profile.alternativeSkills.length} low={profile.alternativeLow.length} skills={profile.alternativeSkills}/>
        </section>

        <section className="rounded-3xl border border-[#c5f36a]/15 bg-[var(--panel)] p-5 sm:p-6">
          <div className="flex items-center gap-2"><GitCompareArrows className="h-4 w-4 text-[#c5f36a]"/><h2 className="text-sm font-semibold">Transferable-skill map</h2></div>
          <p className="mt-1 text-[10px] text-[var(--muted)]">Exact skill-key overlap between the built-in role templates. This is a starting point, not a full competency equivalence.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {profile.currentSkills.filter(skill => profile.alternativeSkills.some(other => other.key === skill.key)).map(skill => <div key={skill.key} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-black/20 p-3"><div><p className="text-xs font-medium text-[var(--text)]">{skill.label}</p><p className="mt-1 text-[9px] text-[var(--muted)]">{skill.assessment ? "Recorded self-rating " + skill.assessment.rating + "/5" : "Not yet assessed"}</p></div><CheckCircle2 className="h-4 w-4 text-emerald-300"/></div>)}
          </div>
          <p className="mt-3 text-[10px] text-[var(--muted)]">{profile.sharedCount} shared skill areas appear in both templates. The number does not measure how easy a career transition will be.</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-[#c5f36a]"/> Signals to investigate</h2>
            <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">These are gaps in recorded data, not proof that you lack a skill.</p>
            <div className="mt-4 space-y-3">
              <Signal title="Current direction · not yet assessed" items={profile.currentMissing.map(item => item.label)} empty="All template skills have a recorded self-assessment."/>
              <Signal title="Alternative direction · not yet assessed" items={profile.alternativeMissing.map(item => item.label)} empty="All template skills have a recorded self-assessment."/>
              <Signal title="Current direction · low self-ratings" items={profile.currentLow.map(item => item.label + " (" + item.assessment!.rating + "/5)")} empty="No low self-ratings recorded for this template."/>
              <Signal title="Alternative direction · low self-ratings" items={profile.alternativeLow.map(item => item.label + " (" + item.assessment!.rating + "/5)")} empty="No low self-ratings recorded for this template."/>
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Compass className="h-4 w-4 text-[#c5f36a]"/> Small experiments before switching</h2>
            <p className="mt-2 text-[10px] leading-5 text-[var(--muted)]">Try a bounded project or practice task to gather better evidence about interest and learning fit.</p>
            <div className="mt-4 space-y-3">
              {experiments.map(item => {
                const sourceKey = "skill-twin-" + current.goal.id + "-" + alternative.id + "-" + item.key;
                const status = savedExperiments[sourceKey];
                return <div key={item.key} className="rounded-xl border border-[var(--line)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium">{item.label}{item.rating !== null ? " · " + item.rating + "/5 self-rating" : ""}</p><span className="text-[9px] text-[var(--muted)]">{item.kind === "unassessed" ? "Not assessed" : "Review signal"}</span></div>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">{item.kind === "unassessed" ? "Explore one small beginner project or practice task and record what you learned." : "Practise once, review your work and reassess only if you have new evidence."}</p>
                  <button type="button" disabled={savingExperiment === item.key || Boolean(status)} onClick={() => void saveExperiment(item)} className="mt-3 rounded-lg border border-[#c5f36a]/20 px-3 py-2 text-[10px] font-medium text-[#dff6ae] hover:bg-[#c5f36a]/10 disabled:cursor-not-allowed disabled:opacity-50">{savingExperiment === item.key ? "Saving…" : status ? "Tracked · " + status : "Add experiment to tracker"}</button>
                </div>;
              })}
              {experiments.length === 0 && <p className="text-xs text-[var(--muted)]">No unassessed or low self-rating skills appear in the available profile data. Try a small real project to test your interest in this direction.</p>}
              {experimentNotice && <p role="status" className="text-[10px] text-[#dff6ae]">{experimentNotice}</p>}
            </div>
            <a href="/features/agent-workbench?skill=career-copilot&prompt=Help%20me%20evaluate%20an%20alternative%20career%20direction%20using%20my%20saved%20career%20profile.%20Treat%20ratings%20as%20self-reported%2C%20not%20objective%20proficiency." className="mt-4 inline-flex items-center gap-1 text-xs text-[#c5f36a]">Discuss with Career Copilot <ArrowUpRight className="h-3 w-3"/></a>
          </div>
        </section>

        {current.nodes.claims.length > 0 && <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <button type="button" onClick={() => setShowEvidence(value => !value)} className="flex w-full items-center justify-between text-left"><span className="text-sm font-semibold">Approved evidence for {current.goal.targetCompany}</span><span className="text-xs text-[#c5f36a]">{showEvidence ? "Hide" : "Show"} · {current.nodes.claims.length}</span></button>
          {showEvidence && <div className="mt-4 space-y-3">{current.nodes.claims.slice(0,5).map((claim,index) => <article key={index} className="rounded-xl border border-[var(--line)] p-3"><p className="text-xs text-[var(--text)]">{claim.claimText}</p><blockquote className="mt-2 border-l-2 border-[#c5f36a]/30 pl-3 text-[10px] leading-5 text-[var(--muted)]">{claim.supportingExcerpt}</blockquote><a href={claim.capture.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[10px] text-[#c5f36a]">{claim.capture.sourceTitle} ↗</a></article>)}</div>}
        </section>}

        <section className="rounded-3xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.035] p-5">
          <h2 className="text-sm font-semibold">Continue with Career Copilot</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Ask for a deeper comparison. Your saved career data is still shared only if you explicitly enable the per-message consent control in Career Copilot.</p>
          <a href={"/features/agent-workbench?skill=career-copilot&prompt=" + encodeURIComponent(copilotPrompt)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#c5f36a] px-4 py-2.5 text-xs font-semibold text-[#100b19]">Discuss this Career Twin <ArrowUpRight className="h-3.5 w-3.5"/></a>
        </section>
      </div>}

      <p className="mt-6 text-[10px] leading-5 text-[var(--muted)]">{data?.methodology.links} {data?.methodology.mapping} {data?.methodology.limits} Career Twin uses built-in role templates, recorded self-assessments and linked activity. It does not certify skills, predict employability or recommend leaving a role.</p>
      <div className="mt-5 flex justify-end"><button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)] hover:text-[var(--text)] disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5"/> Refresh profile</button></div>
    </section>
  </div></ApexWorkspaceShell>;
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Target; label: string; value: string | number; note: string }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-black/20 p-4"><div className="flex items-center gap-2 text-[10px] text-[var(--muted)]"><Icon className="h-3.5 w-3.5 text-[#c5f36a]"/>{label}</div><p className="mt-2 break-words text-lg font-semibold text-[var(--text)]">{value}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{note}</p></div>;
}
function DirectionCard({ title, subtitle, coverage, assessed, total, low, skills }: { title: string; subtitle: string; coverage: number; assessed: number; total: number; low: number; skills: Array<{ key: string; label: string; assessment: { rating: number } | null; completed: number; open: number; evaluatedAttempts: number }> }) {
  return <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c5f36a]">{title}</p><h2 className="mt-2 text-lg font-semibold">{subtitle}</h2><div className="mt-4 flex items-end justify-between"><div><p className="text-3xl font-semibold tabular-nums">{coverage}%</p><p className="text-[10px] text-[var(--muted)]">assessment coverage · {assessed}/{total}</p></div><p className="text-[10px] text-[var(--muted)]">{low} low self-ratings</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#c5f36a]" style={{width: coverage + "%"}}/></div><div className="mt-4 space-y-2">{skills.map(skill => <div key={skill.key} className="flex items-center justify-between gap-3 text-[10px]"><span className="text-[var(--text)]">{skill.label}</span><span className="shrink-0 text-[var(--muted)]">{skill.assessment ? skill.assessment.rating + "/5 self-rating" : "Not assessed"}</span></div>)}</div></section>;
}
function Signal({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><p className="text-[10px] font-medium text-[var(--text)]">{title}</p>{items.length ? <ul className="mt-2 space-y-1">{items.slice(0,6).map(item => <li key={item} className="text-[10px] text-[var(--muted)]">• {item}</li>)}</ul> : <p className="mt-1 text-[10px] text-[var(--muted)]">{empty}</p>}</div>;
}

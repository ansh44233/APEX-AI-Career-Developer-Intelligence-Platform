"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, BrainCircuit, BriefcaseBusiness, CheckCircle2, Compass, GitCompareArrows, Layers3, RefreshCw, Target, TrendingUp } from "lucide-react";

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

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/intelligence/graph", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load your saved career profile.");
      setData(payload);
      setGoalId(current => current && payload.goals.some((item: GoalGraph) => item.goal.id === current) ? current : payload.goals[0]?.goal.id ?? "");
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

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/features/career-command-center" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Command Center</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard <ArrowUpRight className="ml-1 inline h-3.5 w-3.5"/></a>
    </header>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><BrainCircuit className="h-4 w-4"/> PHASE 44 · CAREER TWIN</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Explore your <span className="text-violet-300">Career Twin.</span></h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">A structured view of your saved career direction, recorded skill signals, roadmap and practice history. Compare an alternative path before making a real-world commitment.</p>
      </div>

      <section className="mb-6 rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
        <div className="flex items-center gap-2"><Target className="h-4 w-4 text-violet-300"/><h2 className="text-sm font-semibold">Choose a direction to explore</h2></div>
        {loading && <p className="mt-4 text-xs text-zinc-500">Building your career profile from saved records…</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{error}</p>}
        {!loading && data && data.goals.length === 0 && <div className="mt-4 rounded-xl border border-dashed border-white/10 p-4"><p className="text-sm font-medium">No active career goal found</p><p className="mt-1 text-xs text-zinc-500">Create a career goal and add a few skill assessments or practice sessions to build your Career Twin.</p><a href="/dashboard" className="mt-3 inline-flex text-xs text-violet-300">Open dashboard <ArrowUpRight className="ml-1 h-3 w-3"/></a></div>}
        {data && data.goals.length > 0 && <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-[11px] text-zinc-400">Saved career direction
            <select value={goalId} onChange={event => setGoalId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] px-3 py-3 text-xs text-white">{data.goals.map(item => <option key={item.goal.id} value={item.goal.id}>{item.goal.targetRole}{item.goal.targetCompany ? " · " + item.goal.targetCompany : ""}</option>)}</select>
          </label>
          <label className="text-[11px] text-zinc-400">Alternative direction
            <select value={alternativeId} onChange={event => setAlternativeId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] px-3 py-3 text-xs text-white">{tracks.map(track => <option key={track.id} value={track.id}>{track.label}</option>)}</select>
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

        <section className="rounded-3xl border border-violet-300/15 bg-[#111119] p-5 sm:p-6">
          <div className="flex items-center gap-2"><GitCompareArrows className="h-4 w-4 text-violet-300"/><h2 className="text-sm font-semibold">Transferable-skill map</h2></div>
          <p className="mt-1 text-[10px] text-zinc-500">Exact skill-key overlap between the built-in role templates. This is a starting point, not a full competency equivalence.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {profile.currentSkills.filter(skill => profile.alternativeSkills.some(other => other.key === skill.key)).map(skill => <div key={skill.key} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 p-3"><div><p className="text-xs font-medium text-zinc-200">{skill.label}</p><p className="mt-1 text-[9px] text-zinc-600">{skill.assessment ? "Recorded self-rating " + skill.assessment.rating + "/5" : "Not yet assessed"}</p></div><CheckCircle2 className="h-4 w-4 text-emerald-300"/></div>)}
          </div>
          <p className="mt-3 text-[10px] text-zinc-500">{profile.sharedCount} shared skill areas appear in both templates. The number does not measure how easy a career transition will be.</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#111119] p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-violet-300"/> Signals to investigate</h2>
            <p className="mt-2 text-[10px] leading-5 text-zinc-500">These are gaps in recorded data, not proof that you lack a skill.</p>
            <div className="mt-4 space-y-3">
              <Signal title="Current direction · not yet assessed" items={profile.currentMissing.map(item => item.label)} empty="All template skills have a recorded self-assessment."/>
              <Signal title="Alternative direction · not yet assessed" items={profile.alternativeMissing.map(item => item.label)} empty="All template skills have a recorded self-assessment."/>
              <Signal title="Current direction · low self-ratings" items={profile.currentLow.map(item => item.label + " (" + item.assessment!.rating + "/5)")} empty="No low self-ratings recorded for this template."/>
              <Signal title="Alternative direction · low self-ratings" items={profile.alternativeLow.map(item => item.label + " (" + item.assessment!.rating + "/5)")} empty="No low self-ratings recorded for this template."/>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#111119] p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Compass className="h-4 w-4 text-violet-300"/> Small experiments before switching</h2>
            <p className="mt-2 text-[10px] leading-5 text-zinc-500">Try a bounded project or practice task to gather better evidence about interest and learning fit.</p>
            <div className="mt-4 space-y-3">
              {profile.alternativeMissing.slice(0,3).map(item => <div key={item.key} className="rounded-xl border border-white/[0.07] p-3"><p className="text-xs font-medium">{item.label}</p><p className="mt-1 text-[10px] text-zinc-500">Explore a small beginner task and record what you learned before changing your saved goal.</p></div>)}
              {profile.alternativeLow.slice(0,2).map(item => <div key={item.key} className="rounded-xl border border-white/[0.07] p-3"><p className="text-xs font-medium">{item.label} · {item.assessment!.rating}/5 self-rating</p><p className="mt-1 text-[10px] text-zinc-500">Practise once, review your work and reassess only if you have new evidence.</p></div>)}
              {profile.alternativeMissing.length === 0 && profile.alternativeLow.length === 0 && <p className="text-xs text-zinc-500">No unassessed or low self-rating skills appear in the available profile data. Try a small real project to test your interest in this direction.</p>}
            </div>
            <a href="/features/agent-workbench?skill=career-copilot&prompt=Help%20me%20evaluate%20an%20alternative%20career%20direction%20using%20my%20saved%20career%20profile.%20Treat%20ratings%20as%20self-reported%2C%20not%20objective%20proficiency." className="mt-4 inline-flex items-center gap-1 text-xs text-violet-300">Discuss with Career Copilot <ArrowUpRight className="h-3 w-3"/></a>
          </div>
        </section>

        {current.nodes.claims.length > 0 && <section className="rounded-3xl border border-white/10 bg-[#111119] p-5">
          <button type="button" onClick={() => setShowEvidence(value => !value)} className="flex w-full items-center justify-between text-left"><span className="text-sm font-semibold">Approved evidence for {current.goal.targetCompany}</span><span className="text-xs text-violet-300">{showEvidence ? "Hide" : "Show"} · {current.nodes.claims.length}</span></button>
          {showEvidence && <div className="mt-4 space-y-3">{current.nodes.claims.slice(0,5).map((claim,index) => <article key={index} className="rounded-xl border border-white/[0.07] p-3"><p className="text-xs text-zinc-200">{claim.claimText}</p><blockquote className="mt-2 border-l-2 border-violet-300/30 pl-3 text-[10px] leading-5 text-zinc-500">{claim.supportingExcerpt}</blockquote><a href={claim.capture.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[10px] text-violet-300">{claim.capture.sourceTitle} ↗</a></article>)}</div>}
        </section>}

        <section className="rounded-3xl border border-violet-300/15 bg-violet-300/[0.035] p-5">
          <h2 className="text-sm font-semibold">Continue with Career Copilot</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Ask for a deeper comparison. Your saved career data is still shared only if you explicitly enable the per-message consent control in Career Copilot.</p>
          <a href={"/features/agent-workbench?skill=career-copilot&prompt=" + encodeURIComponent(copilotPrompt)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-semibold text-[#100b19]">Discuss this Career Twin <ArrowUpRight className="h-3.5 w-3.5"/></a>
        </section>
      </div>}

      <p className="mt-6 text-[10px] leading-5 text-zinc-600">{data?.methodology.links} {data?.methodology.mapping} {data?.methodology.limits} Career Twin uses built-in role templates, recorded self-assessments and linked activity. It does not certify skills, predict employability or recommend leaving a role.</p>
      <div className="mt-5 flex justify-end"><button type="button" onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-white disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5"/> Refresh profile</button></div>
    </section>
  </main>;
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Target; label: string; value: string | number; note: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"><div className="flex items-center gap-2 text-[10px] text-zinc-500"><Icon className="h-3.5 w-3.5 text-violet-300"/>{label}</div><p className="mt-2 break-words text-lg font-semibold text-white">{value}</p><p className="mt-1 text-[10px] text-zinc-600">{note}</p></div>;
}
function DirectionCard({ title, subtitle, coverage, assessed, total, low, skills }: { title: string; subtitle: string; coverage: number; assessed: number; total: number; low: number; skills: Array<{ key: string; label: string; assessment: { rating: number } | null; completed: number; open: number; evaluatedAttempts: number }> }) {
  return <section className="rounded-3xl border border-white/10 bg-[#111119] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">{title}</p><h2 className="mt-2 text-lg font-semibold">{subtitle}</h2><div className="mt-4 flex items-end justify-between"><div><p className="text-3xl font-semibold tabular-nums">{coverage}%</p><p className="text-[10px] text-zinc-500">assessment coverage · {assessed}/{total}</p></div><p className="text-[10px] text-zinc-500">{low} low self-ratings</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-300" style={{width: coverage + "%"}}/></div><div className="mt-4 space-y-2">{skills.map(skill => <div key={skill.key} className="flex items-center justify-between gap-3 text-[10px]"><span className="text-zinc-300">{skill.label}</span><span className="shrink-0 text-zinc-500">{skill.assessment ? skill.assessment.rating + "/5 self-rating" : "Not assessed"}</span></div>)}</div></section>;
}
function Signal({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><p className="text-[10px] font-medium text-zinc-300">{title}</p>{items.length ? <ul className="mt-2 space-y-1">{items.slice(0,6).map(item => <li key={item} className="text-[10px] text-zinc-500">• {item}</li>)}</ul> : <p className="mt-1 text-[10px] text-zinc-600">{empty}</p>}</div>;
}

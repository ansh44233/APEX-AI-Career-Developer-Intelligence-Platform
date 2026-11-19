"use client";
import { ApexWorkspaceShell } from "@/components/apex-workspace-shell";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, BookOpen, Building2, CheckCircle2, Clock3, Loader2, Play, Save, ShieldCheck } from "lucide-react";
import { companyDirectory, companyRoles } from "@/lib/company-directory";
import { CompanyPreparationWorkspace } from "@/components/company-preparation-workspace";

type Claim = { id:string; company:string; role:string; claimType:"explicit_requirement"|"employer_guidance"; claimText:string; supportingExcerpt:string; capture:{sourceTitle:string;sourceUrl:string;retrievedAt:string;contentHash:string} };
type Session = { id:string; module:string; title:string; status:string; startedAt:string; _count?:{attempts:number} };
type Attempt = { id:string; prompt:string; responseText:string|null; createdAt:string };
type Goal = { id:string; targetRole:string; targetCompany:string|null; status:string };
type PrepPrompt = { id:string; title:string; question:string; followUp:string; rubric:string[]; source?:Claim };

async function api<T>(url:string, init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,headers:{"Content-Type":"application/json",...init?.headers},cache:"no-store"});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||`Request failed (${response.status})`);
  return data as T;
}

function makePrompts(claims:Claim[]):PrepPrompt[]{
  const evidencePrompts=claims.map(claim=>({
    id:claim.id,
    title:claim.claimType==="explicit_requirement"?"Evidence-based requirement":"Employer guidance",
    question:`The approved employer source states: “${claim.claimText}”\n\nHow would you demonstrate this capability for the ${claim.role} role? Give a concrete example, explain your approach, and describe how you would validate the result.`,
    followUp:"What trade-offs, constraints or failure cases would you consider? How would you explain your decisions to an interviewer?",
    rubric:["Addresses the exact source-backed claim","Uses a specific and truthful example","Explains personal contribution and reasoning","Discusses validation, trade-offs or measurable outcomes"],
    source:claim
  }));
  const general:PrepPrompt[]=[
    {id:"role-project",title:"Role-specific project walkthrough",question:"Choose one project relevant to this role. Explain the problem, your contribution, the architecture or workflow, and the result. Which decision would you defend most strongly?",followUp:"What would you change if you had to rebuild it with twice the scale or half the time?",rubric:["Clear problem and context","Specific personal contribution","Reasoned technical or product decisions","Honest outcome and reflection"]},
    {id:"role-debug",title:"Problem-solving scenario",question:"Describe how you would investigate an unfamiliar issue affecting a production feature or important user workflow. Explain how you would narrow the cause, prioritise risk and communicate progress.",followUp:"What evidence would make you change your initial hypothesis?",rubric:["Structured investigation","Uses evidence rather than guesses","Considers user impact and risk","Communicates decisions and next steps"]}
  ];
  return [...evidencePrompts,...general];
}

export default function InterviewPrep(){
  const [company,setCompany]=useState("Google");
  const [role,setRole]=useState("Software Engineer");
  const [claims,setClaims]=useState<Claim[]>([]);
  const [index,setIndex]=useState(0);
  const [answer,setAnswer]=useState("");
  const [sessions,setSessions]=useState<Session[]>([]);
  const [goals,setGoals]=useState<Goal[]>([]);
  const [goalId,setGoalId]=useState("");
  const [active,setActive]=useState<Session|null>(null);
  const [attempts,setAttempts]=useState<Attempt[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [signedIn,setSignedIn]=useState(false);
  const [notice,setNotice]=useState("");

  const companyRecord=companyDirectory.find(item=>item.name===company)||companyDirectory[0];
  const prompts=useMemo(()=>makePrompts(claims),[claims]);
  const prompt=prompts[index]||prompts[0];

  const loadClaims=useCallback(async()=>{
    try{
      const data=await api<{claims:Claim[]}>(`/api/company-intelligence/claims?company=${encodeURIComponent(company)}&role=${encodeURIComponent(role)}`);
      setClaims(data.claims);
    }catch{setClaims([]);}
  },[company,role]);

  const loadAccount=useCallback(async()=>{
    try{
      const [sessionData,goalData]=await Promise.all([
        api<{sessions:Session[]}>("/api/practice/sessions?limit=30"),
        api<{goals:Goal[]}>("/api/career-goals")
      ]);
      setSessions(sessionData.sessions.filter(item=>item.module==="interview"));
      const activeGoals=goalData.goals.filter(item=>item.status==="active");
      setGoals(activeGoals);
      const matching=activeGoals.find(item=>item.targetCompany?.toLowerCase()===company.toLowerCase()&&item.targetRole.toLowerCase()===role.toLowerCase());
      setGoalId(current=>current||matching?.id||"");
      setSignedIn(true);
    }catch{setSignedIn(false);}
    finally{setLoading(false);}
  },[company,role]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const requestedCompany=params.get("company");
    const requestedRole=params.get("role");
    if(requestedCompany&&companyDirectory.some(item=>item.name===requestedCompany))setCompany(requestedCompany);
    if(requestedRole&&companyRoles.includes(requestedRole))setRole(requestedRole);
  },[]);
  useEffect(()=>{void loadClaims();},[loadClaims]);
  useEffect(()=>{void loadAccount();},[loadAccount]);

  async function start(){
    setBusy(true);setNotice("");
    try{
      const data=await api<{session:Session}>("/api/practice/sessions",{method:"POST",body:JSON.stringify({module:"interview",title:`${company} · ${role} interview preparation`,...(goalId?{goalId}:{})})});
      setActive(data.session);setAttempts([]);setAnswer("");setIndex(0);
      setNotice("Interview preparation session started. Your written answers can now be saved.");
      await loadAccount();
    }catch(error){setNotice(error instanceof Error?error.message:"Could not start session.");}
    finally{setBusy(false);}
  }

  async function save(){
    if(!active||!answer.trim()||!prompt)return;
    setBusy(true);setNotice("");
    try{
      const data=await api<{attempt:Attempt}>(`/api/practice/sessions/${active.id}/attempts`,{method:"POST",body:JSON.stringify({prompt:prompt.question,responseText:answer})});
      setAttempts(current=>[data.attempt,...current]);setNotice("Answer saved to your interview preparation session.");setAnswer("");
      await loadAccount();
    }catch(error){setNotice(error instanceof Error?error.message:"Could not save answer.");}
    finally{setBusy(false);}
  }

  async function openSession(session:Session){
    setBusy(true);setNotice("");
    try{
      const data=await api<{attempts:Attempt[]}>(`/api/practice/sessions/${session.id}/attempts`);
      setActive(session);setAttempts(data.attempts);setAnswer("");setNotice("Saved session loaded. Closed sessions are read-only.");
    }catch(error){setNotice(error instanceof Error?error.message:"Could not load session.");}
    finally{setBusy(false);}
  }

  async function finish(status:"completed"|"abandoned"){
    if(!active)return;
    setBusy(true);
    try{
      await api(`/api/practice/sessions/${active.id}`,{method:"PATCH",body:JSON.stringify({status})});
      setActive(null);setAnswer("");setNotice(status==="completed"?"Preparation session completed.":"Session closed.");await loadAccount();
    }catch(error){setNotice(error instanceof Error?error.message:"Could not update session.");}
    finally{setBusy(false);}
  }

  return <ApexWorkspaceShell><div className="min-h-screen text-[var(--text)]">
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-[#c5f36a]"><BookOpen className="h-4 w-4"/> APEX INTELLIGENCE / INTERVIEW PREPARATION</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Prepare with evidence.<br/><span className="text-[#c5f36a]">Practise with purpose.</span></h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">A structured practice set for your selected company and role. Approved employer claims become preparation prompts; they are not represented as actual interview questions.</p>\n      <a href="/features/mock-interview" className="mt-5 inline-flex items-center rounded-xl border border-[#c5f36a]/20 bg-[#c5f36a]/10 px-4 py-3 text-xs font-semibold text-[#dff6ae] hover:bg-[#c5f36a]/15">Launch structured mock interview <ArrowRight className="ml-2 h-3.5 w-3.5"/></a>

      <div className="mt-8 grid gap-3 rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:grid-cols-2">
        <label className="text-xs text-[var(--muted)]">Company<select value={company} onChange={e=>{setCompany(e.target.value);setClaims([]);setIndex(0);setActive(null);}} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] p-3 text-sm text-[var(--text)]">{companyDirectory.map(item=><option key={item.name}>{item.name}</option>)}</select></label>
        <label className="text-xs text-[var(--muted)]">Target role<select value={role} onChange={e=>{setRole(e.target.value);setClaims([]);setIndex(0);setActive(null);}} className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--app-bg)] p-3 text-sm text-[var(--text)]">{companyRoles.map(item=><option key={item}>{item}</option>)}</select></label>
      </div>

      <div className="mt-5"><CompanyPreparationWorkspace goalId={goalId}/></div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full border border-[#c5f36a]/15 bg-[#c5f36a]/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#dff6ae]">{prompt?.title||"Practice prompt"}</span><span className="text-xs text-[var(--muted)]">Prompt {index+1} of {prompts.length}</span></div>
          <h2 className="mt-7 whitespace-pre-line text-xl font-semibold leading-relaxed sm:text-2xl">{prompt?.question}</h2>
          <label className="mt-7 block text-xs font-semibold text-[var(--text)]">YOUR ANSWER<textarea value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={20000} placeholder="Write your answer, approach and example…" className="mt-3 min-h-48 w-full rounded-2xl border border-[var(--line)] bg-black/20 p-4 text-sm leading-6 text-[var(--text)] outline-none focus:border-[#c5f36a]/50"/></label>
          <div className="mt-4 flex flex-wrap gap-2">
            {!active?<><label className="flex flex-col gap-2 text-[11px] text-[var(--muted)]">Link to career goal<select value={goalId} onChange={e=>setGoalId(e.target.value)} className="rounded-lg border border-[var(--line)] bg-zinc-900 px-3 py-2 text-xs text-[var(--text)]"><option value="">General practice</option>{goals.map(goal=><option key={goal.id} value={goal.id}>{goal.targetRole}{goal.targetCompany?" · "+goal.targetCompany:""}</option>)}</select></label><button onClick={start} disabled={busy||!signedIn} className="self-end rounded-xl bg-[#c5f36a] px-5 py-3 text-sm font-semibold hover:bg-[#c5f36a] disabled:opacity-40"><Play className="mr-2 inline h-4 w-4"/> Start preparation</button></>:<button onClick={save} disabled={busy||!answer.trim()||active.status!=="in_progress"} className="self-end rounded-xl bg-[#c5f36a] px-5 py-3 text-sm font-semibold hover:bg-[#c5f36a] disabled:opacity-40"><Save className="mr-2 inline h-4 w-4"/> Save answer</button>}
            <button onClick={()=>{setIndex((index+1)%prompts.length);setAnswer("");}} className="self-end rounded-xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--text)] hover:bg-white/[0.05]">Next prompt <ArrowRight className="ml-1 inline h-4 w-4"/></button>
          </div>
          {active&&<div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--line)] pt-5">{active.status==="in_progress"?<><button onClick={()=>finish("completed")} disabled={busy} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs text-emerald-200">Complete session</button><button onClick={()=>finish("abandoned")} disabled={busy} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">End for now</button></>:<span className="text-xs text-[var(--muted)]">Read-only · {active.status.replace("_"," ")}</span>}</div>}
          {prompt?.source&&<div className="mt-6 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><BadgeCheck className="h-4 w-4"/> Approved source context · {prompt.source.claimType==="explicit_requirement"?"Explicit requirement":"Employer guidance"}</p><p className="mt-3 text-sm leading-6 text-[var(--text)]">“{prompt.source.supportingExcerpt}”</p><a href={prompt.source.capture.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-200 underline underline-offset-4">{prompt.source.capture.sourceTitle} <ShieldCheck className="h-3 w-3"/></a><p className="mt-2 text-[10px] text-[var(--muted)]">Captured {new Date(prompt.source.capture.retrievedAt).toLocaleDateString()} · SHA-256 {prompt.source.capture.contentHash.slice(0,16)}…</p></div>}
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4"><p className="text-xs font-semibold text-[var(--text)]">SELF-REVIEW RUBRIC</p><ul className="mt-3 space-y-2">{prompt?.rubric.map(item=><li key={item} className="text-xs leading-5 text-[var(--muted)]"><CheckCircle2 className="mr-2 inline h-3.5 w-3.5 text-[#c5f36a]"/>{item}</li>)}</ul><p className="mt-4 text-xs leading-5 text-[var(--muted)]">Follow-up: {prompt?.followUp}</p><p className="mt-2 text-[10px] text-[var(--muted)]">Rubric is a self-review aid; APEX does not automatically grade this response.</p></div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5"><p className="text-xs font-semibold tracking-wider text-[var(--muted)]">EVIDENCE COVERAGE</p><p className="mt-3 text-3xl font-semibold">{claims.length}</p><p className="mt-1 text-xs text-[var(--muted)]">approved claims for this exact company and role</p>{claims.length===0&&<p className="mt-4 text-xs leading-5 text-[var(--muted)]">No approved claims are available for this selection yet. General role practice prompts remain available below.</p>}<div className="mt-4 rounded-xl border border-[var(--line)] p-3 text-xs text-[var(--muted)]"><Building2 className="mr-2 inline h-4 w-4 text-[#c5f36a]"/>{company} · {role}</div><a href={`/features/company-intelligence`} className="mt-3 inline-flex text-xs text-[#dff6ae]">Review company evidence <ArrowRight className="ml-1 inline h-3 w-3"/></a></div>
          <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5"><p className="text-xs font-semibold tracking-wider text-[var(--muted)]">SESSION HISTORY</p>{loading?<p className="mt-4 text-xs text-[var(--muted)]"><Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin"/>Loading…</p>:!signedIn?<div className="mt-4"><p className="text-xs leading-5 text-[var(--muted)]">Sign in to save answers and return to sessions.</p><a href="/sign-in" className="mt-3 inline-block rounded-lg bg-white/[0.08] px-3 py-2 text-xs">Sign in</a></div>:sessions.length===0?<p className="mt-4 text-xs text-[var(--muted)]">No interview sessions yet.</p>:<ul className="mt-4 space-y-2">{sessions.map(session=><li key={session.id}><button onClick={()=>openSession(session)} disabled={busy} className={`w-full rounded-xl border p-3 text-left ${active?.id===session.id?"border-[#c5f36a]/30 bg-[#c5f36a]/[0.06]":"border-[var(--line)]"}`}><span className="flex items-center justify-between gap-2 text-xs text-[var(--text)]"><span className="truncate">{session.title}</span><span className="text-[10px] text-[var(--muted)]">{session.status.replace("_"," ")}</span></span><span className="mt-2 flex items-center gap-2 text-[10px] text-[var(--muted)]"><Clock3 className="h-3 w-3"/>{new Date(session.startedAt).toLocaleDateString()} · {session._count?.attempts??0} answers</span></button></li>)}</ul>}</div>
          {active&&attempts.length>0&&<div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-5"><p className="text-xs font-semibold tracking-wider text-[var(--muted)]">SAVED ANSWERS</p><ul className="mt-4 space-y-3">{attempts.map(item=><li key={item.id} className="rounded-xl border border-[var(--line)] p-3"><p className="text-xs font-medium text-[var(--text)]">{item.prompt}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[var(--muted)]">{item.responseText||"No written response saved."}</p><p className="mt-2 text-[10px] text-[var(--muted)]">{new Date(item.createdAt).toLocaleString()}</p></li>)}</ul></div>}
          {notice&&<div role="status" className="rounded-xl border border-[#c5f36a]/15 bg-[#c5f36a]/[0.06] px-4 py-3 text-xs text-[#dff6ae]">{notice}</div>}
          <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-4"><p className="text-xs font-semibold text-amber-200">Evidence integrity</p><p className="mt-2 text-xs leading-5 text-[var(--muted)]">Only moderator-approved claims are loaded. APEX turns those claims into original practice prompts; it does not claim these are questions asked by the employer. General prompts are APEX-authored. No AI grading or interview-frequency prediction is active.</p></div>
        </aside>
      </div>
    </section>
  </main></ApexWorkspaceShell>;
}

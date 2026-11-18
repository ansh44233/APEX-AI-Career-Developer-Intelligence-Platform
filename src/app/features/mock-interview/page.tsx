"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Loader2, Play, Save, ShieldCheck, Sparkles } from "lucide-react";
import { companyDirectory, companyRoles } from "@/lib/company-directory";
import { InterviewIntelligencePanel } from "@/components/interview-intelligence-panel";

type Round = "Behavioural" | "Technical" | "System Design";
type Question = { id:string; round:Round; title:string; prompt:string; followUp:string; minutes:number; rubric:string[] };
type Session = { id:string; module:string; title:string; status:string; startedAt:string; _count?:{attempts:number} };
type Attempt = { id:string; prompt:string; responseText:string|null; createdAt:string };
type Goal = { id:string; targetRole:string; targetCompany:string|null; status:string };

const starterQuestionSet:Question[]=[
 {id:"beh-1",round:"Behavioural",title:"Introduction and motivation",prompt:"Walk me through your background and explain why this role is a logical next step for you.",followUp:"Which experience best demonstrates the strengths you would bring to this team?",minutes:3,rubric:["Clear and relevant narrative","Specific examples","Connects experience to the role"]},
 {id:"beh-2",round:"Behavioural",title:"Ownership and challenge",prompt:"Describe a challenging project or task where you had meaningful ownership. What was difficult, what did you do, and what happened?",followUp:"What would you do differently if you faced the same situation again?",minutes:5,rubric:["Explains personal contribution","Shows sound judgement","Reflects honestly on outcome"]},
 {id:"beh-3",round:"Behavioural",title:"Collaboration and feedback",prompt:"Tell me about a time you disagreed with a teammate or received difficult feedback. How did you respond?",followUp:"How did you know the situation had improved?",minutes:4,rubric:["Respectful communication","Evidence of listening","Constructive resolution"]},
 {id:"tech-1",round:"Technical",title:"Problem decomposition",prompt:"You are given an unfamiliar technical problem with incomplete requirements. Explain how you would clarify it, break it down and choose an initial approach.",followUp:"What assumptions would you validate before committing to the design?",minutes:6,rubric:["Clarifies requirements","Breaks problem into steps","Explains complexity or constraints"]},
 {id:"tech-2",round:"Technical",title:"Debugging and reliability",prompt:"A feature that worked yesterday is now failing intermittently for some users. Describe your investigation from first signal to a safe fix.",followUp:"How would you reduce the chance of the issue returning?",minutes:6,rubric:["Uses logs and reproducible evidence","Prioritises user impact","Validates fix and regression risk"]},
 {id:"tech-3",round:"Technical",title:"Trade-offs",prompt:"Choose a technical decision from a project you know. Explain at least two viable options and why you selected one.",followUp:"What new constraint would make you choose the other option?",minutes:5,rubric:["Compares credible alternatives","Names trade-offs","Explains context behind decision"]},
 {id:"sys-1",round:"System Design",title:"Design a scalable service",prompt:"Design a service that accepts user requests, stores records and lets users retrieve them later. Start with requirements, then describe APIs, data model and major components.",followUp:"Where might bottlenecks appear as usage grows, and how would you investigate them?",minutes:8,rubric:["Functional and non-functional requirements","API and data model","Scaling and reliability considerations"]},
 {id:"sys-2",round:"System Design",title:"Failure handling",prompt:"Your service depends on a database and a third-party API. Explain how you would handle slow responses, partial failures and recovery.",followUp:"Which operations should be retried, and how would you avoid duplicate effects?",minutes:7,rubric:["Timeout and failure boundaries","Retry and idempotency reasoning","Observability and recovery"]},
 {id:"sys-3",round:"System Design",title:"Security and privacy",prompt:"Review the design you just described. Identify the main data-protection and access-control risks and explain how you would reduce them.",followUp:"How would you verify that the controls continue working after changes?",minutes:6,rubric:["Threat-aware design","Least-privilege access","Testing and monitoring controls"]}
];

async function api<T>(url:string,init?:RequestInit):Promise<T>{
 const response=await fetch(url,{...init,headers:{"Content-Type":"application/json",...init?.headers},cache:"no-store"});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);
 return data as T;
}

export default function MockInterview(){
 const [company,setCompany]=useState("General practice");
 const [role,setRole]=useState("Software Engineer");
 const [goalId,setGoalId]=useState("");
 const [goals,setGoals]=useState<Goal[]>([]);
 const [sessions,setSessions]=useState<Session[]>([]);
 const [active,setActive]=useState<Session|null>(null);
 const [attempts,setAttempts]=useState<Attempt[]>([]);
 const [questionSet,setQuestionSet]=useState<Question[]>(starterQuestionSet);
 const [index,setIndex]=useState(0);
 const [answer,setAnswer]=useState("");
 const [selfReview,setSelfReview]=useState("3");
 const [remaining,setRemaining]=useState(starterQuestionSet[0].minutes*60);
 const [timerRunning,setTimerRunning]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [generating,setGenerating]=useState(false);
 const [signedIn,setSignedIn]=useState(false);
 const [notice,setNotice]=useState("");

 const question=questionSet[index];
 const rounds=useMemo(()=>["Behavioural","Technical","System Design"] as Round[],[]);
 const currentRoundIndex=rounds.indexOf(question.round);

 const loadAccount=useCallback(async()=>{
  try{
   const [sessionData,goalData]=await Promise.all([
    api<{sessions:Session[]}>("/api/practice/sessions?limit=50"),
    api<{goals:Goal[]}>("/api/career-goals")
   ]);
   setSessions(sessionData.sessions.filter(s=>s.module==="interview"&&s.title.startsWith("Mock interview · ")));
   const activeGoals=goalData.goals.filter(g=>g.status==="active");
   setGoals(activeGoals);setSignedIn(true);
   const match=activeGoals.find(g=>g.targetCompany?.toLowerCase()===company.toLowerCase()&&g.targetRole.toLowerCase()===role.toLowerCase());
   setGoalId(v=>v||match?.id||"");
  }catch{setSignedIn(false);}
  finally{setLoading(false);}
 },[company,role]);

 useEffect(()=>{void loadAccount();},[loadAccount]);
 useEffect(()=>{
  if(!timerRunning)return;
  if(remaining<=0){setTimerRunning(false);setNotice("Question timer ended. Save your response or continue when ready.");return;}
  const id=window.setInterval(()=>setRemaining(v=>Math.max(0,v-1)),1000);
  return ()=>window.clearInterval(id);
 },[timerRunning,remaining]);

 function moveTo(next:number){
  const safe=Math.max(0,Math.min(questionSet.length-1,next));
  setIndex(safe);setAnswer("");setSelfReview("3");setRemaining(questionSet[safe].minutes*60);setTimerRunning(false);
 }

 async function generateMoreQuestions(){
  if(generating||!signedIn)return;
  setGenerating(true);setNotice("");
  try{
   const result=await api<{questions:Array<{id:string;title:string;category:string;difficulty:"Easy"|"Medium"|"Hard";prompt:string;followUp:string;evaluation:string[]}>}>("/api/questions/generate",{method:"POST",body:JSON.stringify({role,company:company==="General practice"?undefined:company,categories:["DSA","JavaScript","React","Backend & APIs","Databases & SQL","CS Fundamentals","System Design","Project Defense","Behavioural"],difficulty:"All",count:5})});
   const additions:Question[]=result.questions.map(item=>({id:item.id,round:item.category==="Behavioural"?"Behavioural":item.category==="System Design"?"System Design":"Technical",title:item.title,prompt:item.prompt,followUp:item.followUp,minutes:item.difficulty==="Hard"?8:item.difficulty==="Medium"?6:4,rubric:item.evaluation}));
   setQuestionSet(previous=>[...previous,...additions]);
   setNotice(additions.length+" fresh questions added to this interview. Keep generating batches whenever you need more.");
  }catch(error){setNotice(error instanceof Error?error.message:"Could not generate another question batch.");}
  finally{setGenerating(false);}
 }

 async function start(){
  setBusy(true);setNotice("");
  try{
   const title=`Mock interview · ${company} · ${role}`;
   const data=await api<{session:Session}>("/api/practice/sessions",{method:"POST",body:JSON.stringify({module:"interview",title,...(goalId?{goalId}:{})})});
   setActive(data.session);setAttempts([]);moveTo(0);setNotice("Mock interview started. The timer is a local practice aid; it is not enforced by the server.");await loadAccount();
  }catch(e){setNotice(e instanceof Error?e.message:"Could not start mock interview.");}
  finally{setBusy(false);}
 }

 async function saveAnswer(){
  if(!active||!answer.trim())return;
  setBusy(true);setNotice("");
  const promptText=`MOCK|${question.id}|Round: ${question.round}|Question ${index+1}/${questionSet.length}\n${question.prompt}`;
  const responseText=`${answer.trim()}\n\nSelf-review rating (1–5): ${selfReview}/5`;
  try{
   const data=await api<{attempt:Attempt}>(`/api/practice/sessions/${active.id}/attempts`,{method:"POST",body:JSON.stringify({prompt:promptText,responseText})});
   setAttempts(v=>[data.attempt,...v]);setAnswer("");setTimerRunning(false);
   setNotice("Response and self-review saved.");
   if(index<questionSet.length-1)moveTo(index+1);
   await loadAccount();
  }catch(e){setNotice(e instanceof Error?e.message:"Could not save response.");}
  finally{setBusy(false);}
 }

 async function openSession(session:Session){
  setBusy(true);setNotice("");
  try{
   const data=await api<{attempts:Attempt[]}>(`/api/practice/sessions/${session.id}/attempts`);
   setActive(session);setAttempts(data.attempts);setTimerRunning(false);setAnswer("");
   const saved=new Set(data.attempts.map(a=>a.prompt.match(/^MOCK\|([^|]+)/)?.[1]).filter(Boolean));
   const next=questionSet.findIndex(q=>!saved.has(q.id));
   moveTo(next<0?questionSet.length-1:next);
   setNotice("Mock interview history loaded. Saved responses are shown below; completed sessions are read-only.");
  }catch(e){setNotice(e instanceof Error?e.message:"Could not load session.");}
  finally{setBusy(false);}
 }

 async function finish(status:"completed"|"abandoned"){
  if(!active)return;
  setBusy(true);
  try{
   await api(`/api/practice/sessions/${active.id}`,{method:"PATCH",body:JSON.stringify({status})});
   setActive(null);setTimerRunning(false);setNotice(status==="completed"?"Mock interview completed.":"Mock interview ended.");await loadAccount();
  }catch(e){setNotice(e instanceof Error?e.message:"Could not close session.");}
  finally{setBusy(false);}
 }

 const minutes=String(Math.floor(remaining/60)).padStart(2,"0");
 const seconds=String(remaining%60).padStart(2,"0");
 const savedIds=new Set(attempts.map(a=>a.prompt.match(/^MOCK\|([^|]+)/)?.[1]).filter(Boolean));

 return <main className="min-h-screen bg-[#09090d] text-white">
  <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8"><a href="/features/interview-prep" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> Interview Preparation</a><span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-[#c6ff3d]">.</span></span><a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a></header>
  <section className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8">
   <p className="text-xs font-semibold tracking-[0.2em] text-[#c6ff3d]">APEX / MOCK INTERVIEW ENGINE</p>
   <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">A structured interview.<br/><span className="text-[#c6ff3d]">Your answers. Your progress.</span></h1>
   <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">Practise across behavioural, technical and system-design rounds. Add fresh questions whenever you need them; generated prompts are original practice material, not an employer's actual interview script.</p><div className="mt-5"><button onClick={generateMoreQuestions} disabled={generating||!signedIn} className="rounded-xl bg-[#c6ff3d] px-4 py-3 text-xs font-bold text-[#0b0d08] transition hover:bg-[#d8ff83] disabled:opacity-50"><Sparkles className="mr-2 inline h-4 w-4"/>{generating?"Generating questions…":"Generate 5 more questions"}</button><span className="ml-3 text-[10px] text-zinc-600">No fixed question-list cap · AI provider required</span></div>
   <div className="mt-8 grid gap-3 rounded-3xl border border-white/10 bg-[#111119] p-5 sm:grid-cols-3">
    <label className="text-xs text-zinc-400">Company context<select value={company} onChange={e=>setCompany(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm text-white"><option>General practice</option>{companyDirectory.map(c=><option key={c.name}>{c.name}</option>)}</select></label>
    <label className="text-xs text-zinc-400">Target role<select value={role} onChange={e=>setRole(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm text-white">{companyRoles.map(r=><option key={r}>{r}</option>)}</select></label>
    <label className="text-xs text-zinc-400">Link to career goal<select value={goalId} onChange={e=>setGoalId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm text-white"><option value="">General practice</option>{goals.map(g=><option key={g.id} value={g.id}>{g.targetRole}{g.targetCompany?" · "+g.targetCompany:""}</option>)}</select></label>
   </div>
   <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
    <section className="rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-7">
     <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-[#c6ff3d]/10 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#d8ff83]">{question.round} ROUND</span><span className="text-xs text-zinc-500">Question {index+1} / {questionSet.length}</span></div>
     <div className="mt-5 flex gap-2">{rounds.map((r,i)=><span key={r} className={`h-1.5 flex-1 rounded-full ${i<=currentRoundIndex?"bg-[#c6ff3d]":"bg-white/10"}`}/>)}</div>
     <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-zinc-500">{question.title}</p><h2 className="mt-2 text-xl font-semibold leading-relaxed sm:text-2xl">{question.prompt}</h2></div><div className="rounded-2xl border border-white/10 px-4 py-3 text-center"><Clock3 className="mx-auto h-4 w-4 text-[#c6ff3d]"/><p className="mt-1 font-mono text-xl tabular-nums">{minutes}:{seconds}</p><p className="text-[10px] text-zinc-500">suggested timer</p></div></div>
     <div className="mt-5 flex flex-wrap gap-2"><button onClick={()=>setTimerRunning(v=>!v)} disabled={!active||active.status!=="in_progress"||remaining===0} className="rounded-lg border border-[#c6ff3d]/20 px-3 py-2 text-xs text-[#d8ff83] disabled:opacity-40"><Play className="mr-1 inline h-3.5 w-3.5"/>{timerRunning?"Pause timer":"Start timer"}</button><button onClick={()=>{setRemaining(question.minutes*60);setTimerRunning(false);}} disabled={!active} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400 disabled:opacity-40">Reset timer</button><span className="self-center text-[10px] text-zinc-600">Timer runs in this browser tab only.</span></div>
     <label className="mt-7 block text-xs font-semibold text-zinc-300">YOUR RESPONSE<textarea value={answer} onChange={e=>setAnswer(e.target.value)} maxLength={20000} placeholder="Structure your answer. Include context, your actions, reasoning and outcome…" className="mt-3 min-h-48 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-200 outline-none focus:border-[#c6ff3d]/50"/></label>
     <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><label className="text-xs text-zinc-400">Self-review rating<select value={selfReview} onChange={e=>setSelfReview(e.target.value)} className="mt-2 block rounded-lg border border-white/10 bg-[#09090d] px-3 py-2 text-xs text-white">{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label><div className="flex flex-wrap gap-2">{!active?<button onClick={start} disabled={busy||!signedIn} className="rounded-xl bg-[#c6ff3d] px-5 py-3 text-sm font-semibold hover:bg-[#c6ff3d] disabled:opacity-40"><Play className="mr-2 inline h-4 w-4"/> Start mock interview</button>:<button onClick={saveAnswer} disabled={busy||!answer.trim()||active.status!=="in_progress"||savedIds.has(question.id)} className="rounded-xl bg-[#c6ff3d] px-5 py-3 text-sm font-semibold hover:bg-[#c6ff3d] disabled:opacity-40"><Save className="mr-2 inline h-4 w-4"/> Save & next</button>}<button onClick={()=>moveTo(index+1)} disabled={index===questionSet.length-1} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300 disabled:opacity-30">Skip <ArrowRight className="ml-1 inline h-4 w-4"/></button></div></div>
     {active&&<div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">{active.status==="in_progress"?<><button onClick={()=>finish("completed")} disabled={busy} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs text-emerald-200">Complete mock interview</button><button onClick={()=>finish("abandoned")} disabled={busy} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-400">End for now</button></>:<span className="text-xs text-zinc-500">Read-only · {active.status.replace("_"," ")}</span>}</div>}
     <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"><p className="text-xs font-semibold text-zinc-300">SELF-REVIEW RUBRIC</p><ul className="mt-3 space-y-2">{question.rubric.map(item=><li key={item} className="text-xs text-zinc-400"><CheckCircle2 className="mr-2 inline h-3.5 w-3.5 text-[#c6ff3d]"/>{item}</li>)}</ul><p className="mt-4 text-xs text-zinc-500">Follow-up: {question.followUp}</p><p className="mt-2 text-[10px] text-zinc-600">The rating is self-reported, not an AI or interviewer assessment.</p></div>
    </section>
    <aside className="space-y-4">
     <div className="rounded-3xl border border-white/10 bg-[#111119] p-5"><p className="text-xs font-semibold tracking-wider text-zinc-400">ROUND MAP</p><ul className="mt-4 space-y-3">{rounds.map(r=><li key={r} className="flex items-center justify-between text-xs"><span className={question.round===r?"text-[#d8ff83]":"text-zinc-400"}>{r}</span><span className="text-zinc-600">{questionSet.filter(q=>q.round===r).length} questions</span></li>)}</ul></div>
     <div className="rounded-3xl border border-white/10 bg-[#111119] p-5"><p className="text-xs font-semibold tracking-wider text-zinc-400">SESSION HISTORY</p>{loading?<p className="mt-4 text-xs text-zinc-500"><Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin"/>Loading…</p>:!signedIn?<div className="mt-4"><p className="text-xs text-zinc-500">Sign in to save mock interviews.</p><a href="/sign-in" className="mt-3 inline-block rounded-lg bg-white/[0.08] px-3 py-2 text-xs">Sign in</a></div>:sessions.length===0?<p className="mt-4 text-xs text-zinc-500">No mock sessions yet.</p>:<ul className="mt-4 space-y-2">{sessions.map(s=><li key={s.id}><button onClick={()=>openSession(s)} disabled={busy} className={`w-full rounded-xl border p-3 text-left ${active?.id===s.id?"border-[#c6ff3d]/30 bg-[#c6ff3d]/[0.06]":"border-white/[0.07]"}`}><span className="flex items-center justify-between gap-2 text-xs text-zinc-200"><span className="truncate">{s.title}</span><span className="text-[10px] text-zinc-500">{s.status.replace("_"," ")}</span></span><span className="mt-2 block text-[10px] text-zinc-500">{new Date(s.startedAt).toLocaleDateString()} · {s._count?.attempts??0} saved</span></button></li>)}</ul>}</div>
     {active&&attempts.length>0&&<div className="rounded-3xl border border-white/10 bg-[#111119] p-5"><p className="text-xs font-semibold tracking-wider text-zinc-400">SAVED ANSWERS ({attempts.length})</p><ul className="mt-4 max-h-96 space-y-3 overflow-auto">{attempts.map(a=><li key={a.id} className="rounded-xl border border-white/[0.07] p-3"><p className="whitespace-pre-wrap text-xs font-medium text-zinc-300">{a.prompt}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-500">{a.responseText}</p><p className="mt-2 text-[10px] text-zinc-600">{new Date(a.createdAt).toLocaleString()}</p></li>)}</ul></div>}
     {notice&&<div role="status" className="rounded-xl border border-[#c6ff3d]/15 bg-[#c6ff3d]/[0.06] px-4 py-3 text-xs text-violet-100">{notice}</div>}
     <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-4"><p className="flex items-center gap-2 text-xs font-semibold text-amber-200"><ShieldCheck className="h-4 w-4"/> Integrity and limitations</p><p className="mt-2 text-xs leading-5 text-zinc-500">These are APEX-authored simulation prompts, not verified questions from a named employer. Timer is browser-local and not server-enforced. Self-review ratings are descriptive only. No AI grading, voice analysis or hiring prediction is active.</p></div>
    </aside>
   </div>
   <div className="mt-6"><InterviewIntelligencePanel goalId={goalId}/></div>
  </section>
 </main>;
}

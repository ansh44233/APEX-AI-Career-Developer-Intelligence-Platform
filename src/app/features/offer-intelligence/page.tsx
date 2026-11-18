"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, Copy, Plus, Scale, ShieldCheck, Trash2 } from "lucide-react";

type Dimension = "compensation" | "growth" | "roleFit" | "flexibility" | "learning" | "manager";
type Offer = {
  id: number; name: string; role: string; fixed: string; variable: string; equity: string;
  benefits: string; work: string; location: string; notes: string;
  ratings: Record<Dimension, number>;
};
const dimensions: { key: Dimension; label: string; description: string }[] = [
  { key: "compensation", label: "Compensation", description: "Overall pay satisfaction, considering fixed and variable components" },
  { key: "growth", label: "Career growth", description: "Potential development and progression" },
  { key: "roleFit", label: "Role fit", description: "How well the responsibilities match your interests and goals" },
  { key: "flexibility", label: "Flexibility", description: "Remote/hybrid options and schedule fit" },
  { key: "learning", label: "Learning", description: "Mentorship, feedback and learning opportunities" },
  { key: "manager", label: "Manager and team", description: "Your confidence in the manager and team environment" },
];
const makeOffer = (id: number): Offer => ({
  id, name: "Offer " + String.fromCharCode(64 + id), role: "", fixed: "", variable: "", equity: "",
  benefits: "", work: "Hybrid", location: "", notes: "",
  ratings: { compensation: 3, growth: 3, roleFit: 3, flexibility: 3, learning: 3, manager: 3 },
});
const defaultWeights: Record<Dimension, number> = { compensation: 25, growth: 20, roleFit: 20, flexibility: 10, learning: 15, manager: 10 };

export default function OfferIntelligence() {
  const [offers, setOffers] = useState<Offer[]>([makeOffer(1), makeOffer(2)]);
  const [weights, setWeights] = useState(defaultWeights);
  const [copied, setCopied] = useState(false);
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const ranked = useMemo(() => offers.map(offer => ({
    ...offer,
    score: totalWeight ? dimensions.reduce((sum, item) => sum + offer.ratings[item.key] * weights[item.key], 0) / totalWeight : 0,
  })).sort((a,b)=>b.score-a.score), [offers, weights, totalWeight]);
  const update = (id: number, patch: Partial<Offer>) => { setOffers(current => current.map(offer => offer.id === id ? { ...offer, ...patch } : offer)); setCopied(false); };
  const updateRating = (id: number, key: Dimension, value: number) => {
    setOffers(current => current.map(offer => offer.id === id ? { ...offer, ratings: { ...offer.ratings, [key]: value } } : offer));
    setCopied(false);
  };
  const addOffer = () => { if (offers.length < 3) setOffers(current => [...current, makeOffer(Math.max(...current.map(o=>o.id))+1)]); };
  const copySummary = async () => {
    const lines = ["APEX · Offer comparison", "Decision weights: " + dimensions.map(d=>d.label+" "+weights[d.key]+"%").join(", "), ...ranked.map((o,i)=>[
      (i+1)+". "+o.name+" — "+o.role, "Weighted preference score: "+o.score.toFixed(2)+"/5 (subjective, based on your ratings)",
      "Fixed annual pay: "+(o.fixed || "Not entered"), "Variable pay: "+(o.variable || "Not entered"),
      "Equity: "+(o.equity || "Not entered"), "Benefits: "+(o.benefits || "Not entered"),
      "Work arrangement: "+o.work, "Location: "+(o.location || "Not entered"), "Notes: "+(o.notes || "None")
    ].join("\n"))];
    try { await navigator.clipboard.writeText(lines.join("\n\n")); setCopied(true); } catch { setCopied(false); }
  };

  return <main className="min-h-screen bg-[#09090d] text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
      <a href="/" className="text-sm text-zinc-400 hover:text-white"><ArrowLeft className="mr-2 inline h-4 w-4"/> APEX home</a>
      <span className="text-sm font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
      <a href="/dashboard" className="text-xs text-zinc-400 hover:text-white">Dashboard <ArrowRight className="ml-1 inline h-3.5 w-3.5"/></a>
    </header>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8">
      <div className="mb-10">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-violet-300"><Scale className="h-4 w-4"/> FEATURE EXPERIENCE / 08</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Offer Intelligence</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">Compare up to three opportunities, separate pay components, and score what matters to you with a transparent decision matrix.</p>
      </div>

      <section className="mb-7 rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Your decision priorities</h2><p className="mt-1 text-xs text-zinc-500">Set the importance of each factor. Weights are normalised automatically in the score.</p></div><span className="text-xs text-zinc-500">Total weight: {totalWeight}%</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{dimensions.map(d=><div key={d.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"><div className="flex justify-between gap-2"><label htmlFor={"weight-"+d.key} className="text-xs font-medium">{d.label}</label><span className="text-xs tabular-nums text-violet-200">{weights[d.key]}%</span></div><input id={"weight-"+d.key} type="range" min="0" max="50" step="5" value={weights[d.key]} onChange={e=>setWeights(current=>({...current,[d.key]:Number(e.target.value)}))} className="mt-3 w-full accent-violet-400"/><p className="mt-1 text-[10px] leading-4 text-zinc-600">{d.description}</p></div>)}</div>
        {totalWeight === 0 && <p className="mt-4 text-xs text-amber-200">Increase at least one weight to calculate preference scores.</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {offers.map((offer,index)=><section key={offer.id} className="rounded-3xl border border-white/10 bg-[#111119] p-5">
          <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/10 text-violet-200"><BriefcaseBusiness className="h-4 w-4"/></span><h2 className="font-semibold">{offer.name}</h2></div>{offers.length>2 && <button aria-label={"Remove "+offer.name} onClick={()=>setOffers(current=>current.filter(item=>item.id!==offer.id))} className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-red-300"><Trash2 className="h-4 w-4"/></button>}</div>
          <label className="block text-[10px] text-zinc-500">COMPANY / OFFER NAME</label><input value={offer.name} onChange={e=>update(offer.id,{name:e.target.value})} maxLength={80} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm outline-none focus:border-violet-400/50"/>
          <label className="mt-4 block text-[10px] text-zinc-500">ROLE / TITLE</label><input value={offer.role} onChange={e=>update(offer.id,{role:e.target.value})} maxLength={100} placeholder="e.g. Software Engineer" className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-sm outline-none focus:border-violet-400/50"/>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {[["fixed","Fixed annual pay"],["variable","Annual variable pay"],["equity","Equity / stock details"]].map(([key,label])=><div key={key} className={key==="equity"?"col-span-2":""}><label className="block text-[10px] text-zinc-500">{label} · INR</label><input value={offer[key as "fixed"|"variable"|"equity"]} onChange={e=>update(offer.id,{[key]:e.target.value})} maxLength={100} placeholder={key==="equity"?"Describe vesting / value":"Amount (e.g. 1200000)"} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-xs outline-none focus:border-violet-400/50"/></div>)}
          </div>
          <label className="mt-4 block text-[10px] text-zinc-500">BENEFITS / OTHER PERKS</label><textarea value={offer.benefits} onChange={e=>update(offer.id,{benefits:e.target.value})} maxLength={1500} placeholder="Health cover, leave, bonus policy, learning budget..." className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-xs leading-5 outline-none focus:border-violet-400/50"/>
          <div className="mt-4 grid grid-cols-2 gap-3"><div><label className="block text-[10px] text-zinc-500">WORK MODEL</label><select value={offer.work} onChange={e=>update(offer.id,{work:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-xs"><option>On-site</option><option>Hybrid</option><option>Remote</option><option>Flexible / unclear</option></select></div><div><label className="block text-[10px] text-zinc-500">LOCATION</label><input value={offer.location} onChange={e=>update(offer.id,{location:e.target.value})} maxLength={100} placeholder="City / region" className="mt-2 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-xs outline-none focus:border-violet-400/50"/></div></div>
          <label className="mt-4 block text-[10px] text-zinc-500">YOUR RATINGS · 1–5</label>
          <div className="mt-3 space-y-3">{dimensions.map(d=><div key={d.key}><div className="flex justify-between gap-2 text-[11px]"><label htmlFor={"rating-"+offer.id+"-"+d.key} className="text-zinc-400">{d.label}</label><span className="text-violet-200">{offer.ratings[d.key]}/5</span></div><input id={"rating-"+offer.id+"-"+d.key} type="range" min="1" max="5" step="1" value={offer.ratings[d.key]} onChange={e=>updateRating(offer.id,d.key,Number(e.target.value))} className="mt-1 w-full accent-violet-400"/></div>)}</div>
          <label className="mt-4 block text-[10px] text-zinc-500">PRIVATE NOTES</label><textarea value={offer.notes} onChange={e=>update(offer.id,{notes:e.target.value})} maxLength={2000} placeholder="Questions to clarify before deciding..." className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-[#09090d] p-3 text-xs leading-5 outline-none focus:border-violet-400/50"/>
          <div className="mt-5 rounded-2xl border border-violet-300/10 bg-violet-400/[0.04] p-4"><p className="text-[10px] text-violet-200">YOUR WEIGHTED PREFERENCE SCORE</p><p className="mt-1 text-3xl font-semibold tabular-nums">{totalWeight ? ranked.find(item=>item.id===offer.id)?.score.toFixed(2) : "—"}<span className="text-sm text-zinc-500"> / 5</span></p><p className="mt-1 text-[10px] text-zinc-600">Based only on your ratings and chosen weights</p></div>
        </section>)}
      </div>
      {offers.length<3 && <button onClick={addOffer} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04]"><Plus className="h-4 w-4"/> Add another offer</button>}

      <section className="mt-7 rounded-3xl border border-white/10 bg-[#111119] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Your comparison result</h2><p className="mt-1 text-xs text-zinc-500">Ranked by your weighted ratings, not by objective career value.</p></div><button onClick={copySummary} className="rounded-xl bg-violet-500 px-4 py-2.5 text-xs font-semibold hover:bg-violet-400"><Copy className="mr-2 inline h-4 w-4"/>{copied?"Copied":"Copy comparison"}</button></div>
        <div className="mt-5 space-y-3">{ranked.map((offer,index)=><div key={offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"><div><p className="text-sm font-medium">{index+1}. {offer.name || "Unnamed offer"}</p><p className="mt-1 text-[10px] text-zinc-500">{offer.role || "Role not entered"} · {offer.work}</p></div><div className="text-right"><p className="text-lg font-semibold tabular-nums">{totalWeight?offer.score.toFixed(2)+"/5":"—"}</p><p className="text-[10px] text-zinc-600">Preference score</p></div></div>)}</div>
        <p className="mt-5 text-xs leading-5 text-zinc-500">Use this as a conversation aid, not an automatic decision. Verify fixed pay, variable-pay conditions, equity vesting, benefits, work expectations, notice period and written contract terms. Consider personal circumstances and ask trusted adults or qualified advisers about consequential employment or contract decisions.</p>
      </section>
      <div className="mt-5 rounded-2xl border border-violet-300/10 bg-violet-400/[0.04] p-5"><p className="flex items-center gap-2 text-xs font-semibold text-violet-200"><ShieldCheck className="h-4 w-4"/> PRIVATE BY DESIGN</p><p className="mt-2 text-xs leading-5 text-zinc-500">Offer details and ratings stay in this page's local state. They are not sent to an API or saved to your account. Copying the comparison explicitly writes its summary to your clipboard.</p></div>
    </section>
  </main>;
}

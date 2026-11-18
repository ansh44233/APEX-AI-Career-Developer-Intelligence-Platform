"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, ShieldCheck, Sparkles, Target, BrainCircuit, Code2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = { mode: "sign-in" | "sign-up" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password, callbackURL: "/dashboard" })
        : await authClient.signIn.email({ email: email.trim(), password, callbackURL: "/dashboard" });
      if (result.error) {
        setError(result.error.message ?? "Authentication failed. Please try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("APEX could not reach its authentication service. The live database and auth environment must be configured before accounts can be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080a08] text-white">
      <div className="pointer-events-none absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-[#c6ff3d]/[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-cyan-400/[0.07] blur-[130px]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#c6ff3d] text-lg font-black text-[#0b0d08] shadow-lg shadow-lime-950/30">A</span><span className="text-lg font-extrabold tracking-[0.18em]">APEX<span className="text-[#c6ff3d]">.</span></span></a>
        <a href="/" className="text-xs font-medium text-zinc-500 transition hover:text-white">Back to home ↗</a>
      </header>
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-12 px-5 pb-14 pt-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#c6ff3d]/20 bg-[#c6ff3d]/[0.06] px-3 py-2 text-[10px] font-bold tracking-[0.18em] text-[#d8ff83]"><Sparkles className="h-3.5 w-3.5"/> YOUR PLACEMENT SEASON STARTS HERE</div>
          <h1 className="mt-7 max-w-2xl text-6xl font-semibold leading-[1.02] tracking-[-0.055em] xl:text-7xl">{isSignUp ? "Build the skills." : "Good to have you"}<br/><span className="text-[#c6ff3d]">{isSignUp ? "Own the interview." : "back in the lab."}</span></h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400">A focused space for company research, technical questions, mock interviews and the small daily wins that add up before placement day.</p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[{icon:Target,label:"Role-aware",sub:"Prep tracks"},{icon:BrainCircuit,label:"Interview",sub:"Practice lab"},{icon:Code2,label:"Skill-building",sub:"Coding arena"}].map(item=><div key={item.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><item.icon className="h-5 w-5 text-[#c6ff3d]"/><p className="mt-5 text-xs font-semibold">{item.label}</p><p className="mt-1 text-[10px] text-zinc-600">{item.sub}</p></div>)}
          </div>
          <p className="mt-8 flex items-center gap-2 text-[11px] text-zinc-600"><ShieldCheck className="h-4 w-4 text-[#c6ff3d]"/> Your practice history is private to your account.</p>
        </div>
        <div className="mx-auto w-full max-w-md">
          <div className="mb-5 lg:hidden"><p className="text-[10px] font-bold tracking-[0.18em] text-[#c6ff3d]">APEX / CAREER WORKSPACE</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">{isSignUp ? "Start your next chapter." : "Welcome back to APEX."}</h1></div>
          <div className="rounded-[2rem] border border-white/[0.1] bg-[#11150f]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-9">
            <div className="mb-8"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-[#c6ff3d]/20 bg-[#c6ff3d]/[0.08] text-[#d8ff83]"><Sparkles className="h-5 w-5"/></div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c6ff3d]">{isSignUp ? "CREATE YOUR ACCOUNT" : "YOUR WORKSPACE AWAITS"}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{isSignUp ? "Join the practice." : "Pick up where you left off."}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">{isSignUp ? "Save sessions, track your goals and build a preparation routine." : "Sign in to continue your preparation and revisit saved work."}</p></div>
            <form onSubmit={submit} className="space-y-4">
              {isSignUp && <label className="block text-xs font-medium text-zinc-300">Your name<input required autoComplete="name" maxLength={80} value={name} onChange={event=>setName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-[#c6ff3d]/60 focus:ring-2 focus:ring-[#c6ff3d]/10" placeholder="How should we call you?"/></label>}
              <label className="block text-xs font-medium text-zinc-300">Email address<input required type="email" autoComplete="email" maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-[#c6ff3d]/60 focus:ring-2 focus:ring-[#c6ff3d]/10" placeholder="you@example.com"/></label>
              <div><label htmlFor="apex-auth-password" className="block text-xs font-medium text-zinc-300">Password</label><span className="relative mt-2 block"><input id="apex-auth-password" required type={showPassword?"text":"password"} autoComplete={isSignUp?"new-password":"current-password"} minLength={isSignUp?12:undefined} maxLength={128} value={password} onChange={event=>setPassword(event.target.value)} className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-[#c6ff3d]/60 focus:ring-2 focus:ring-[#c6ff3d]/10" placeholder={isSignUp?"At least 12 characters":"Your password"}/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?"Hide password":"Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:text-white">{showPassword?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></span>{isSignUp&&<span className="mt-2 block text-[10px] text-zinc-600">Use at least 12 characters.</span>}</div>
              {error&&<p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-xs leading-5 text-red-200">{error}</p>}
              <button disabled={busy} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#c6ff3d] px-4 py-4 text-sm font-bold text-[#0b0d08] shadow-lg shadow-lime-950/20 transition hover:-translate-y-0.5 hover:bg-[#d8ff83] disabled:cursor-not-allowed disabled:opacity-60">{busy?<LoaderCircle className="h-4 w-4 animate-spin"/>:<>{isSignUp?"Create my account":"Sign in to APEX"}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></>}</button>
            </form>
            <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-white/[0.07]"/><span className="text-[9px] font-semibold tracking-[0.16em] text-zinc-700">YOUR NEXT CHAPTER</span><span className="h-px flex-1 bg-white/[0.07]"/></div>
            <p className="text-center text-xs text-zinc-500">{isSignUp?"Already have an account?":"New to APEX?"} <a className="font-semibold text-[#d8ff83] transition hover:text-white" href={isSignUp?"/sign-in":"/sign-up"}>{isSignUp?"Sign in":"Create an account"}</a></p>
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-[10px] text-zinc-600"><ShieldCheck className="h-3.5 w-3.5 text-[#c6ff3d]"/> Passwords are securely handled by Better Auth.</p>
        </div>
      </section>
    </main>
  );
}

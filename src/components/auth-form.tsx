"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = { mode: "sign-in" | "sign-up" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
            callbackURL: "/dashboard",
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
            callbackURL: "/dashboard",
          });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not connect to APEX authentication. Check your setup and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
        <a href="/" className="mb-10 flex items-center gap-3 self-center">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500 text-lg font-black">A</span>
          <span className="text-lg font-extrabold tracking-[0.18em]">APEX<span className="text-violet-400">.</span></span>
        </a>

        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 shadow-2xl shadow-black/30 sm:p-9">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Your workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight">{isSignUp ? "Create your account" : "Welcome back"}</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {isSignUp ? "Create an APEX account to keep your preparation organised." : "Sign in to continue your preparation."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isSignUp && (
              <label className="block text-sm text-zinc-300">
                Name
                <input
                  required
                  autoComplete="name"
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400"
                  placeholder="Your name"
                />
              </label>
            )}
            <label className="block text-sm text-zinc-300">
              Email
              <input
                required
                type="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm text-zinc-300">
              Password
              <input
                required
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={isSignUp ? 12 : undefined}
                maxLength={128}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400"
                placeholder={isSignUp ? "At least 12 characters" : "Your password"}
              />
              {isSignUp && <span className="mt-1.5 block text-xs text-zinc-500">Use at least 12 characters.</span>}
            </label>

            {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-200">{error}</p>}

            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <>{isSignUp ? "Create account" : "Sign in"} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            {isSignUp ? "Already have an account?" : "New to APEX?"}{" "}
            <a className="font-medium text-violet-300 hover:text-violet-200" href={isSignUp ? "/sign-in" : "/sign-up"}>
              {isSignUp ? "Sign in" : "Create an account"}
            </a>
          </p>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
          <ShieldCheck className="h-3.5 w-3.5" /> Passwords are handled by Better Auth, not stored in plain text.
        </p>
      </div>
    </main>
  );
}

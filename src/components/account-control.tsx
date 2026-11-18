"use client";

import { useRouter } from "next/navigation";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function AccountControl() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  if (isPending) {
    return <span className="hidden text-xs text-zinc-500 sm:inline">Checking account…</span>;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <a href="/sign-in" className="rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.05]">Sign in</a>
        <a href="/sign-up" className="rounded-xl bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400">Create account</a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-36 items-center gap-2 truncate text-xs text-zinc-300 sm:flex">
        <UserRound className="h-4 w-4 shrink-0 text-violet-300" />
        {session.user.name || session.user.email}
      </span>
      <button
        type="button"
        onClick={signOut}
        className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.05]"
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );
}

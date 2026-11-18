import "server-only";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/** Returns the authenticated user's ID, or null when no valid session exists. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

/** Ends the current Better Auth session and clears its cookies. */
export async function revokeCurrentSession() {
  await auth.api.signOut({ headers: await headers() });
}

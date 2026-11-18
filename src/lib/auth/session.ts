import "server-only";

import { headers } from "next/headers";

/** Returns the authenticated user's ID, or null when no valid session exists. */
export async function getCurrentUserId(): Promise<string | null> {
  // Auth configuration reads runtime secrets and must not run during build-time
  // collection of unrelated API routes.
  const { auth } = await import("@/lib/auth");
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id ?? null;
}

/** Ends the current Better Auth session and clears its cookies. */
export async function revokeCurrentSession() {
  const { auth } = await import("@/lib/auth");
  await auth.api.signOut({ headers: await headers() });
}

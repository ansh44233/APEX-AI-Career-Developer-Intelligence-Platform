import { NextRequest } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Construct Better Auth handlers on demand so runtime secrets/database config
// are not evaluated while Next.js collects route data during the build.
async function getHandlers() {
  const { auth } = await import("@/lib/auth");
  return toNextJsHandler(auth);
}

export async function GET(request: NextRequest) {
  const handlers = await getHandlers();
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const handlers = await getHandlers();
  return handlers.POST(request);
}

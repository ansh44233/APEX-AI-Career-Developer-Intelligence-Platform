import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** @deprecated Use /api/agent/conversations and /api/agent/conversations/:id/messages. */
export async function POST() {
  return NextResponse.json(
    { error: "This single-turn endpoint has been replaced. Create a conversation at /api/agent/conversations and send messages to /api/agent/conversations/:id/messages." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}

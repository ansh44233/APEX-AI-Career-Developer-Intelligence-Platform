import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { proposeAgentTool } from "@/lib/agent/provider";
import { z } from "zod";
import { enforceUserRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({ text: z.string().trim().min(1).max(5_000) }).strict();

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Provide text of up to 5,000 characters." }, { status: 400 });
  const rateLimitResponse = await enforceUserRateLimit(userId, "agent-tool-proposal", 8, 60 * 60);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const proposal = await proposeAgentTool(parsed.data.text);
    return NextResponse.json({ proposal, requiresApproval: Boolean(proposal), executed: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "AI_PROVIDER_NOT_CONFIGURED") return NextResponse.json({ error: "AI provider is not configured." }, { status: 503 });
    if (code === "AI_PROVIDER_CONFIGURATION_INVALID") return NextResponse.json({ error: "AI provider configuration is invalid." }, { status: 503 });
    return NextResponse.json({ error: "Could not generate a valid tool proposal." }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { APEX_TOOLS, executeApexTool } from "@/lib/agent/tools";
import { parseExecuteAgentTool } from "@/lib/validation/agent-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json({ tools: APEX_TOOLS }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  const parsed = parseExecuteAgentTool(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tool request. Explicit approval is required.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const execution = executeApexTool(parsed.data.toolId, parsed.data.input);
    return NextResponse.json({ execution, persisted: false }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The selected tool could not be completed." }, { status: 500 });
  }
}

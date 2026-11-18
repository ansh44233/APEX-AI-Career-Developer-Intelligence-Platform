import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseCreateAgentConversation } from "@/lib/validation/agent-conversation";
import { APEX_SKILLS } from "@/lib/skills/registry";
import { enforceUserRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, Math.floor(rawLimit))) : 20;
  try {
    const conversations = await prisma.agentConversation.findMany({
      where: { userId }, orderBy: { updatedAt: "desc" }, take: limit,
      select: { id: true, skillSlug: true, title: true, createdAt: true, updatedAt: true, _count: { select: { messages: true } } },
    });
    return NextResponse.json({ conversations, limit }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Conversation storage is unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = parseCreateAgentConversation(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid conversation request.", details: parsed.error.flatten() }, { status: 400 });
  const rateLimitResponse = await enforceUserRateLimit(userId, "agent-conversation-create", 10, 60 * 60);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const skill = APEX_SKILLS.find((item) => item.slug === parsed.data.skill);
    if (!skill) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
    const conversation = await prisma.agentConversation.create({
      data: { userId, skillSlug: parsed.data.skill, title: `${skill.name} conversation` },
      select: { id: true, skillSlug: true, title: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ conversation }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Conversation storage is unavailable." }, { status: 503 });
  }
}

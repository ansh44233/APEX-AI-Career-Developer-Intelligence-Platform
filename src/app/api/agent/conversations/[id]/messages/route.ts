import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { buildAgentMessages } from "@/lib/agent/prompt";
import { generateAgentReply } from "@/lib/agent/provider";
import { prisma } from "@/lib/prisma";
import { APEX_SKILLS, isApexSkillSlug } from "@/lib/skills/registry";
import { parseSendAgentMessage } from "@/lib/validation/agent-conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = parseSendAgentMessage(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid message.", details: parsed.error.flatten() }, { status: 400 });

  try {
    const conversation = await prisma.agentConversation.findFirst({
      where: { id, userId }, select: { id: true, skillSlug: true },
    });
    if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    if (!isApexSkillSlug(conversation.skillSlug)) return NextResponse.json({ error: "Conversation skill is no longer available." }, { status: 409 });

    const count = await prisma.agentMessage.count({ where: { conversationId: id } });
    if (count >= 100) return NextResponse.json({ error: "This conversation has reached its 100-message limit. Start a new conversation to continue." }, { status: 409 });

    const skill = APEX_SKILLS.find((item) => item.slug === conversation.skillSlug);
    if (!skill) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
    const instructions = await readFile(path.join(process.cwd(), "skills", skill.slug, "SKILL.md"), "utf8");
    const history = await prisma.agentMessage.findMany({
      where: { conversationId: id }, orderBy: { createdAt: "desc" }, take: 12,
      select: { role: true, content: true },
    });
    const orderedHistory = history.reverse() as Array<{ role: "user" | "assistant"; content: string }>;
    const userMessage = parsed.data.message;
    await prisma.agentMessage.create({ data: { conversationId: id, role: "user", content: userMessage } });
    await prisma.agentConversation.update({ where: { id }, data: { updatedAt: new Date() } });

    try {
      const reply = await generateAgentReply(buildAgentMessages(skill.name, instructions, [...orderedHistory, { role: "user", content: userMessage }]));
      const assistantMessage = await prisma.agentMessage.create({
        data: { conversationId: id, role: "assistant", content: reply },
        select: { id: true, role: true, content: true, createdAt: true },
      });
      await prisma.agentConversation.update({ where: { id }, data: { updatedAt: new Date() } });
      return NextResponse.json({ message: assistantMessage }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      const code = error instanceof Error ? error.message : "AI_PROVIDER_REQUEST_FAILED";
      if (code === "AI_PROVIDER_NOT_CONFIGURED") return NextResponse.json({ error: "AI provider is not configured. Your message was saved; configure the provider before retrying." }, { status: 503 });
      if (code === "AI_PROVIDER_CONFIGURATION_INVALID") return NextResponse.json({ error: "AI provider configuration is invalid." }, { status: 503 });
      return NextResponse.json({ error: "The AI provider could not complete this request. Your message was saved; you can send another message." }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Conversation storage or skill loading is unavailable." }, { status: 503 });
  }
}

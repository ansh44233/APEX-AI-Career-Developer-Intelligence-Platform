import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  try {
    const conversation = await prisma.agentConversation.findFirst({
      where: { id, userId },
      select: {
        id: true, skillSlug: true, title: true, createdAt: true, updatedAt: true,
        messages: { orderBy: { createdAt: "asc" }, take: 100, select: { id: true, role: true, content: true, createdAt: true } },
      },
    });
    if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    return NextResponse.json({ conversation }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Conversation storage is unavailable." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  try {
    const result = await prisma.agentConversation.deleteMany({ where: { id, userId } });
    if (result.count === 0) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Conversation could not be deleted." }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { updateJobEventSchema } from "@/lib/validation/job-timeline-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await context.params;
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "Timeline event not found." }, { status: 404 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = updateJobEventSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid event update.", details: parsed.error.flatten() }, { status: 400 });
    const existing = await prisma.jobTimelineEvent.findFirst({ where: { id: parsedId.data, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Timeline event not found." }, { status: 404 });
    const { scheduledAt, status, ...rest } = parsed.data;
    const event = await prisma.jobTimelineEvent.update({
      where: { id: existing.id },
      data: {
        ...rest,
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
        ...(status ? { status, completedAt: status === "completed" ? new Date() : null } : {}),
      },
      select: { id: true, jobId: true, eventType: true, title: true, details: true, scheduledAt: true, status: true, completedAt: true, updatedAt: true },
    });
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Follow-up storage is unavailable. Check database configuration." }, { status: 503 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await context.params;
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "Timeline event not found." }, { status: 404 });
    const result = await prisma.jobTimelineEvent.deleteMany({ where: { id: parsedId.data, userId } });
    if (!result.count) return NextResponse.json({ error: "Timeline event not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Follow-up storage is unavailable. Check database configuration." }, { status: 503 });
  }
}

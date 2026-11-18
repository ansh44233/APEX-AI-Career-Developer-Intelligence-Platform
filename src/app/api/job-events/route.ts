import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createJobEventSchema } from "@/lib/validation/job-timeline-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const events = await prisma.jobTimelineEvent.findMany({
      where: { userId },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
      take: 250,
      select: {
        id: true, jobId: true, eventType: true, title: true, details: true,
        scheduledAt: true, status: true, completedAt: true, createdAt: true,
        job: { select: { company: true, role: true, status: true } },
      },
    });
    return NextResponse.json({ events }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Follow-up storage is unavailable. Check database configuration." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = createJobEventSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid timeline event.", details: parsed.error.flatten() }, { status: 400 });
    const job = await prisma.jobApplication.findFirst({ where: { id: parsed.data.jobId, userId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
    const event = await prisma.jobTimelineEvent.create({
      data: { userId, jobId: job.id, eventType: parsed.data.eventType, title: parsed.data.title, details: parsed.data.details || null, scheduledAt: new Date(parsed.data.scheduledAt) },
      select: { id: true, jobId: true, eventType: true, title: true, details: true, scheduledAt: true, status: true, completedAt: true, createdAt: true },
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Follow-up storage is unavailable. Check database configuration." }, { status: 503 });
  }
}

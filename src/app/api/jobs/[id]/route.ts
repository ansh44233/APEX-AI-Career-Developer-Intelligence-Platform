import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseUpdateJobApplication } from "@/lib/validation/job-application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await context.params;
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = parseUpdateJobApplication(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid job update.", details: parsed.error.flatten() }, { status: 400 });
    const existing = await prisma.jobApplication.findFirst({ where: { id: parsedId.data, userId }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
    if (parsed.data.goalId) {
      const goal = await prisma.careerGoal.findFirst({ where: { id: parsed.data.goalId, userId }, select: { id: true } });
      if (!goal) return NextResponse.json({ error: "Career goal not found." }, { status: 404 });
    }
    const { appliedAt, ...rest } = parsed.data;
    const job = await prisma.jobApplication.update({
      where: { id: existing.id },
      data: { ...rest, ...(appliedAt !== undefined ? { appliedAt: appliedAt ? new Date(appliedAt + "T00:00:00.000Z") : null } : {}) },
      select: { id: true, company: true, role: true, location: true, sourceUrl: true, jobDescription: true, status: true, appliedAt: true, notes: true, goalId: true, updatedAt: true },
    });
    return NextResponse.json({ job });
  } catch { return NextResponse.json({ error: "Job storage is unavailable. Check database configuration." }, { status: 503 }); }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await context.params;
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
    const result = await prisma.jobApplication.deleteMany({ where: { id: parsedId.data, userId } });
    if (!result.count) return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch { return NextResponse.json({ error: "Job storage is unavailable. Check database configuration." }, { status: 503 }); }
}

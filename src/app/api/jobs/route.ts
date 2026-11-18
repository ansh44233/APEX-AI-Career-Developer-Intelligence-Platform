import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseCreateJobApplication } from "@/lib/validation/job-application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const jobs = await prisma.jobApplication.findMany({
      where: { userId }, orderBy: { updatedAt: "desc" }, take: 100,
      select: { id: true, company: true, role: true, location: true, sourceUrl: true, jobDescription: true, status: true, appliedAt: true, notes: true, goalId: true, createdAt: true, updatedAt: true, goal: { select: { targetRole: true, targetCompany: true } } },
    });
    return NextResponse.json({ jobs }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Job storage is unavailable. Check database configuration." }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = parseCreateJobApplication(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid job listing.", details: parsed.error.flatten() }, { status: 400 });
    if (parsed.data.goalId) {
      const goal = await prisma.careerGoal.findFirst({ where: { id: parsed.data.goalId, userId }, select: { id: true } });
      if (!goal) return NextResponse.json({ error: "Career goal not found." }, { status: 404 });
    }
    const job = await prisma.jobApplication.create({
      data: { userId, company: parsed.data.company, role: parsed.data.role, location: parsed.data.location || null, sourceUrl: parsed.data.sourceUrl || null, jobDescription: parsed.data.jobDescription, goalId: parsed.data.goalId || null, notes: parsed.data.notes || null },
      select: { id: true, company: true, role: true, location: true, sourceUrl: true, jobDescription: true, status: true, goalId: true, notes: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ job }, { status: 201 });
  } catch { return NextResponse.json({ error: "Job storage is unavailable. Check database configuration." }, { status: 503 }); }
}

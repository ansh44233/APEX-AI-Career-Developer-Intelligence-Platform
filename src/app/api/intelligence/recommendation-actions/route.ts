import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { recommendationActionSchema } from "@/lib/validation/recommendation-action";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const actions = await prisma.careerRecommendationAction.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
      select: {
        id: true, sourceKey: true, title: true, reason: true, href: true, basis: true,
        status: true, dueAt: true, acceptedAt: true, completedAt: true, createdAt: true, updatedAt: true,
        goal: { select: { id: true, targetRole: true, targetCompany: true } },
        job: { select: { id: true, company: true, role: true, status: true } },
        roadmapTask: { select: { id: true, title: true, status: true, module: true } },
      },
    });
    return NextResponse.json({ actions }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Recommendation tracking is unavailable. Apply migrations and regenerate Prisma Client." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = recommendationActionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid recommendation action.", details: parsed.error.flatten() }, { status: 400 });

    const data = parsed.data;
    let roadmapTaskId: string | null = null;
    let goalId = data.goalId ?? null;
    if (data.sourceKey.startsWith("roadmap-")) {
      const candidateId = data.sourceKey.slice("roadmap-".length);
      const task = await prisma.careerRoadmapTask.findFirst({
        where: { id: candidateId, goal: { userId } },
        select: { id: true, goalId: true },
      });
      if (!task) return NextResponse.json({ error: "Preparation task not found." }, { status: 404 });
      if (goalId && goalId !== task.goalId) return NextResponse.json({ error: "The selected goal does not match this preparation task." }, { status: 400 });
      roadmapTaskId = task.id;
      goalId = task.goalId;
    }
    if (goalId) {
      const goal = await prisma.careerGoal.findFirst({ where: { id: goalId, userId }, select: { id: true } });
      if (!goal) return NextResponse.json({ error: "Career goal not found." }, { status: 404 });
    }
    if (data.jobId) {
      const job = await prisma.jobApplication.findFirst({ where: { id: data.jobId, userId }, select: { id: true, goalId: true } });
      if (!job) return NextResponse.json({ error: "Job application not found." }, { status: 404 });
      if (goalId && job.goalId && job.goalId !== goalId) return NextResponse.json({ error: "The selected job belongs to a different career goal." }, { status: 400 });
    }

    const existing = await prisma.careerRecommendationAction.findUnique({
      where: { userId_sourceKey: { userId, sourceKey: data.sourceKey } },
      select: { id: true, status: true },
    });
    if (existing?.status === "completed") return NextResponse.json({ error: "This recommendation is already completed." }, { status: 409 });

    const now = new Date();
    const values = {
      title: data.title,
      reason: data.reason,
      href: data.href,
      basis: data.basis,
      status: data.action,
      goalId,
      jobId: data.jobId ?? null,
      roadmapTaskId,
      dueAt: data.action === "deferred" && data.dueAt ? new Date(data.dueAt) : null,
      acceptedAt: data.action === "accepted" ? now : null,
      completedAt: null,
    };
    const action = existing
      ? await prisma.careerRecommendationAction.update({ where: { id: existing.id }, data: values, select: { id: true, sourceKey: true, status: true, title: true, dueAt: true, goalId: true, jobId: true, roadmapTaskId: true } })
      : await prisma.careerRecommendationAction.create({ data: { userId, sourceKey: data.sourceKey, ...values }, select: { id: true, sourceKey: true, status: true, title: true, dueAt: true, goalId: true, jobId: true, roadmapTaskId: true } });

    return NextResponse.json({ action }, { status: existing ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Recommendation tracking could not be saved." }, { status: 503 });
  }
}

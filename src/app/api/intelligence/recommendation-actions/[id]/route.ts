import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { completeRecommendationActionSchema } from "@/lib/validation/recommendation-action";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await context.params;
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "Recommendation action not found." }, { status: 404 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = completeRecommendationActionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid completion request." }, { status: 400 });

    const action = await prisma.$transaction(async (tx) => {
      const existing = await tx.careerRecommendationAction.findFirst({
        where: { id: parsedId.data, userId },
        select: { id: true, status: true, roadmapTaskId: true },
      });
      if (!existing) return null;
      if (existing.status === "completed") return tx.careerRecommendationAction.findUnique({ where: { id: existing.id } });
      if (existing.status === "dismissed") throw new Error("DISMISSED_ACTION");
      if (existing.roadmapTaskId) {
        const task = await tx.careerRoadmapTask.findFirst({
          where: { id: existing.roadmapTaskId, goal: { userId } },
          select: { id: true },
        });
        if (!task) throw new Error("LINKED_TASK_NOT_FOUND");
        await tx.careerRoadmapTask.update({ where: { id: task.id }, data: { status: "completed" } });
      }
      return tx.careerRecommendationAction.update({
        where: { id: existing.id },
        data: { status: "completed", completedAt: new Date() },
        select: { id: true, sourceKey: true, title: true, status: true, completedAt: true, goalId: true, jobId: true, roadmapTaskId: true },
      });
    });
    if (!action) return NextResponse.json({ error: "Recommendation action not found." }, { status: 404 });
    return NextResponse.json({ action });
  } catch (cause) {
    if (cause instanceof Error && cause.message === "DISMISSED_ACTION") return NextResponse.json({ error: "A dismissed recommendation cannot be completed. Accept it first." }, { status: 409 });
    if (cause instanceof Error && cause.message === "LINKED_TASK_NOT_FOUND") return NextResponse.json({ error: "The linked preparation task is no longer available." }, { status: 404 });
    return NextResponse.json({ error: "Recommendation action could not be completed." }, { status: 503 });
  }
}

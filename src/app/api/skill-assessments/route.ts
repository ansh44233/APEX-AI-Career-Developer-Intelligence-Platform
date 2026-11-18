import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { parseCreateSkillAssessment } from "@/lib/validation/skill-assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const rateLimitResponse = await enforceUserRateLimit(userId, "skill-assessment-list-read", 30, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const assessments = await prisma.skillAssessment.findMany({
      where: { userId },
      orderBy: [{ skillKey: "asc" }, { assessedAt: "desc" }],
      take: 250,
      select: {
        id: true, skillKey: true, rating: true, evidenceNote: true, assessedAt: true, goalId: true,
      },
    });
    return NextResponse.json({ assessments }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Skill assessment storage is unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

    const parsed = parseCreateSkillAssessment(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid skill assessment.", details: parsed.error.flatten() }, { status: 400 });
    }

    if (parsed.data.goalId) {
      const goal = await prisma.careerGoal.findFirst({
        where: { id: parsed.data.goalId, userId }, select: { id: true },
      });
      if (!goal) return NextResponse.json({ error: "Career goal not found." }, { status: 404 });
    }

    const rateLimitResponse = await enforceUserRateLimit(userId, "skill-assessment-create", 20, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const assessment = await prisma.skillAssessment.create({
      data: {
        userId,
        skillKey: parsed.data.skillKey.toLowerCase().replace(/\s+/g, "_"),
        rating: parsed.data.rating,
        evidenceNote: parsed.data.evidenceNote || null,
        goalId: parsed.data.goalId || null,
      },
      select: { id: true, skillKey: true, rating: true, evidenceNote: true, assessedAt: true, goalId: true },
    });
    return NextResponse.json({ assessment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Skill assessment storage is unavailable." }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseUpdateSkillAssessment } from "@/lib/validation/skill-assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await context.params;
    const existing = await prisma.skillAssessment.findFirst({
      where: { id, userId }, select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Skill assessment not found." }, { status: 404 });

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = parseUpdateSkillAssessment(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid skill assessment update.", details: parsed.error.flatten() }, { status: 400 });
    }

    const assessment = await prisma.skillAssessment.update({
      where: { id },
      data: {
        ...(parsed.data.rating !== undefined ? { rating: parsed.data.rating } : {}),
        ...(parsed.data.evidenceNote !== undefined ? { evidenceNote: parsed.data.evidenceNote } : {}),
        assessedAt: new Date(),
      },
      select: { id: true, skillKey: true, rating: true, evidenceNote: true, assessedAt: true, goalId: true },
    });
    return NextResponse.json({ assessment });
  } catch {
    return NextResponse.json({ error: "Skill assessment storage is unavailable." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await context.params;
    const result = await prisma.skillAssessment.deleteMany({ where: { id, userId } });
    if (result.count === 0) return NextResponse.json({ error: "Skill assessment not found." }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Skill assessment storage is unavailable." }, { status: 503 });
  }
}

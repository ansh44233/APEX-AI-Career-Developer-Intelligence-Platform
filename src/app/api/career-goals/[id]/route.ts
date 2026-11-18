import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseUpdateCareerGoal } from "@/lib/validation/career-goal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function unavailable() {
  return NextResponse.json(
    { error: "Career goal storage is unavailable. Check database configuration." },
    { status: 503 },
  );
}

async function ownedGoalId(context: RouteContext, userId: string) {
  const { id } = await context.params;
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return null;

  const goal = await prisma.careerGoal.findFirst({
    where: { id: parsedId.data, userId },
    select: { id: true },
  });
  return goal?.id ?? null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const goalId = await ownedGoalId(context, userId);
    if (!goalId) {
      return NextResponse.json({ error: "Career goal not found." }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = parseUpdateCareerGoal(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid career goal update.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = {
      ...(parsed.data.targetRole !== undefined
        ? { targetRole: parsed.data.targetRole }
        : {}),
      ...(parsed.data.targetCompany !== undefined
        ? { targetCompany: parsed.data.targetCompany || null }
        : {}),
      ...(parsed.data.targetDate !== undefined
        ? {
            targetDate: parsed.data.targetDate
              ? new Date(parsed.data.targetDate + "T00:00:00.000Z")
              : null,
          }
        : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    };

    const goal = await prisma.careerGoal.update({
      where: { id: goalId },
      data,
      select: {
        id: true,
        targetRole: true,
        targetCompany: true,
        targetDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ goal });
  } catch {
    return unavailable();
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const goalId = await ownedGoalId(context, userId);
    if (!goalId) {
      return NextResponse.json({ error: "Career goal not found." }, { status: 404 });
    }

    await prisma.careerGoal.delete({ where: { id: goalId } });
    return NextResponse.json({ deleted: true });
  } catch {
    return unavailable();
  }
}

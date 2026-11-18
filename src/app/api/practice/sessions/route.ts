import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { parseCreatePracticeSession } from "@/lib/validation/practice";

export const runtime = "nodejs";

function unavailable() {
  return NextResponse.json(
    { error: "Practice storage is unavailable. Check database configuration." },
    { status: 503 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const rateLimitResponse = await enforceUserRateLimit(userId, "practice-session-list-read", 30, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(rawLimit)
      ? Math.min(50, Math.max(1, Math.floor(rawLimit)))
      : 20;

    const sessions = await prisma.practiceSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: limit,
      select: {
        id: true,
        module: true,
        title: true,
        status: true,
        startedAt: true,
        completedAt: true,
        goalId: true,
        roadmapTaskId: true,
        _count: { select: { attempts: true } },
      },
    });

    return NextResponse.json({ sessions, limit });
  } catch {
    return unavailable();
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = parseCreatePracticeSession(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid practice session.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (parsed.data.goalId) {
      const goal = await prisma.careerGoal.findFirst({
        where: { id: parsed.data.goalId, userId },
        select: { id: true },
      });
      if (!goal) {
        return NextResponse.json({ error: "Career goal not found." }, { status: 404 });
      }
    }

    const rateLimitResponse = await enforceUserRateLimit(userId, "practice-session-create", 20, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await prisma.practiceSession.create({
      data: {
        userId,
        module: parsed.data.module,
        title: parsed.data.title,
        ...(parsed.data.goalId ? { goalId: parsed.data.goalId } : {}),
      },
      select: {
        id: true,
        module: true,
        title: true,
        status: true,
        startedAt: true,
        goalId: true,
        roadmapTaskId: true,
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch {
    return unavailable();
  }
}

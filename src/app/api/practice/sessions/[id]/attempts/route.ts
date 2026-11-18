import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { parseCreatePracticeAttempt, parsePracticeEvaluation } from "@/lib/validation/practice";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function unavailable() {
  return NextResponse.json(
    { error: "Practice storage is unavailable. Check database configuration." },
    { status: 503 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const rateLimitResponse = await enforceUserRateLimit(userId, "practice-attempt-list-read", 30, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await context.params;
    const session = await prisma.practiceSession.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Practice session not found." }, { status: 404 });
    }

    const attempts = await prisma.practiceAttempt.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        prompt: true,
        responseText: true,
        score: true,
        feedbackJson: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { attempts },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return unavailable();
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id: sessionId } = await context.params;
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, status: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Practice session not found." }, { status: 404 });
    }
    if (session.status === "completed" || session.status === "abandoned") {
      return NextResponse.json(
        { error: "This practice session is closed to new attempts." },
        { status: 409 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = parseCreatePracticeAttempt(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid practice attempt.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const rateLimitResponse = await enforceUserRateLimit(userId, "practice-attempt-create", 30, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const attempt = await prisma.practiceAttempt.create({
      data: {
        sessionId: session.id,
        prompt: parsed.data.prompt,
        ...(parsed.data.responseText !== undefined
          ? { responseText: parsed.data.responseText }
          : {}),
      },
      select: {
        id: true,
        sessionId: true,
        prompt: true,
        responseText: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ attempt }, { status: 201 });
  } catch {
    return unavailable();
  }
}


export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id: sessionId } = await context.params;
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, status: true },
    });
    if (!session) return NextResponse.json({ error: "Practice session not found." }, { status: 404 });

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = parsePracticeEvaluation(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid practice evaluation.", details: parsed.error.flatten() }, { status: 400 });

    const attempt = await prisma.practiceAttempt.findFirst({
      where: { id: parsed.data.attemptId, sessionId: session.id },
      select: { id: true, feedbackJson: true },
    });
    if (!attempt) return NextResponse.json({ error: "Attempt not found in this session." }, { status: 404 });

    const rateLimitResponse = await enforceUserRateLimit(userId, "practice-attempt-evaluate", 30, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const score = parsed.data.rubric.reduce((sum, item) => sum + item.rating, 0) / parsed.data.rubric.length;
    const feedbackJson = {
      version: 1,
      source: "learner_self_evaluation",
      evaluatedAt: new Date().toISOString(),
      rubric: parsed.data.rubric,
      strengths: parsed.data.strengths ?? "",
      improvementAreas: parsed.data.improvementAreas ?? "",
      nextAction: parsed.data.nextAction ?? "",
    };
    const updated = await prisma.practiceAttempt.update({
      where: { id: attempt.id },
      data: { feedbackJson, score },
      select: { id: true, score: true, feedbackJson: true },
    });
    return NextResponse.json({ evaluation: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return unavailable();
  }
}

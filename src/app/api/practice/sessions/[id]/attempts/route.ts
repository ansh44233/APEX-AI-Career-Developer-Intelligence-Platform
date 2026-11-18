import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseCreatePracticeAttempt } from "@/lib/validation/practice";

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

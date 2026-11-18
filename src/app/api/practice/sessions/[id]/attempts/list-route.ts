import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

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
    return NextResponse.json(
      { error: "Practice storage is unavailable. Check database configuration." },
      { status: 503 },
    );
  }
}

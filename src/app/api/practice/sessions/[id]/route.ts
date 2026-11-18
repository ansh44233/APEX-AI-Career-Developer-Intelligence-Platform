import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
const statusSchema = z.object({
  status: z.enum(["in_progress", "completed", "abandoned"]),
}).strict();

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const session = await prisma.practiceSession.findFirst({
      where: { id, userId },
      select: { id: true, status: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Practice session not found." }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session status." }, { status: 400 });
    }
    if (session.status !== "in_progress" && parsed.data.status !== session.status) {
      return NextResponse.json({ error: "Closed sessions cannot be reopened or changed." }, { status: 409 });
    }

    const updated = await prisma.practiceSession.update({
      where: { id: session.id },
      data: {
        status: parsed.data.status,
        completedAt: parsed.data.status === "in_progress" ? null : new Date(),
      },
      select: { id: true, status: true, completedAt: true },
    });

    return NextResponse.json({ session: updated });
  } catch {
    return NextResponse.json(
      { error: "Practice storage is unavailable. Check database configuration." },
      { status: 503 },
    );
  }
}

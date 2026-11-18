import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };
const updateSchema = z.object({ status: z.enum(["todo", "in_progress", "completed"]) }).strict();

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Roadmap task not found." }, { status: 404 });

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid task status." }, { status: 400 });

    const result = await prisma.careerRoadmapTask.updateMany({
      where: { id, goal: { userId } },
      data: { status: parsed.data.status, updatedAt: new Date() },
    });
    if (result.count === 0) return NextResponse.json({ error: "Roadmap task not found." }, { status: 404 });

    const task = await prisma.careerRoadmapTask.findFirst({
      where: { id, goal: { userId } },
      select: { id: true, goalId: true, status: true, updatedAt: true },
    });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Could not update roadmap task." }, { status: 503 });
  }
}

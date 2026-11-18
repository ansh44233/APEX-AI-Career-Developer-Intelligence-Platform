import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({ taskId: z.string().uuid() }).strict();

const moduleMap: Record<string, { module: "interview" | "coding" | "system_design" | "resume" | "project_defense"; href: string }> = {
  "/features/interview-lab": { module: "interview", href: "/features/interview-lab" },
  "/features/mock-interview": { module: "interview", href: "/features/interview-lab" },
  "/features/oa-arena": { module: "coding", href: "/features/oa-arena" },
};

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "A valid roadmap task ID is required." }, { status: 400 });

    const task = await prisma.careerRoadmapTask.findFirst({
      where: { id: parsed.data.taskId, goal: { userId, status: "active" } },
      select: { id: true, goalId: true, title: true, description: true, skillKey: true, module: true, goal: { select: { targetRole: true, targetCompany: true } } },
    });
    if (!task) return NextResponse.json({ error: "Roadmap task not found for an active career goal." }, { status: 404 });

    const destination = moduleMap[task.module];
    if (!destination) return NextResponse.json({ error: "This roadmap module does not yet support a guided practice launch." }, { status: 422 });

    const session = await prisma.practiceSession.create({
      data: {
        userId,
        goalId: task.goalId,
        roadmapTaskId: task.id,
        module: destination.module,
        title: ("Learning task · " + task.title).slice(0, 120),
      },
      select: { id: true, module: true, title: true, goalId: true, roadmapTaskId: true, status: true, startedAt: true },
    });

    const params = new URLSearchParams({ sessionId: session.id, taskId: task.id });
    return NextResponse.json({
      session,
      task: { id: task.id, title: task.title, description: task.description, skillKey: task.skillKey },
      goal: task.goal,
      href: destination.href + "?" + params.toString(),
      methodology: "The session is linked to the owning career goal and exact roadmap task. Saved attempts remain associated through the session; completing a session does not automatically complete the roadmap task.",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create a guided practice session. Check database configuration and migrations." }, { status: 503 });
  }
}

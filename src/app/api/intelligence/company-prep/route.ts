import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const goalId = request.nextUrl.searchParams.get("goalId");
    if (!goalId || !UUID.test(goalId)) {
      return NextResponse.json({ error: "A valid career goal ID is required." }, { status: 400 });
    }

    const goal = await prisma.careerGoal.findFirst({
      where: { id: goalId, userId },
      select: { id: true, targetRole: true, targetCompany: true, targetDate: true, status: true },
    });
    if (!goal) return NextResponse.json({ error: "Career goal not found." }, { status: 404 });

    const [claims, tasks, sessions] = await Promise.all([
      goal.targetCompany
        ? prisma.companyEvidenceClaim.findMany({
            where: { status: "approved", company: goal.targetCompany, role: goal.targetRole },
            orderBy: { reviewedAt: "desc" },
            take: 50,
            select: {
              id: true, claimType: true, claimText: true, supportingExcerpt: true,
              capture: { select: { sourceTitle: true, sourceUrl: true, retrievedAt: true, contentHash: true } },
            },
          })
        : Promise.resolve([]),
      prisma.careerRoadmapTask.findMany({
        where: { goalId: goal.id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        take: 200,
        select: {
          id: true, title: true, description: true, phase: true, module: true, skillKey: true, status: true,
          evidenceClaim: { select: { id: true, claimType: true, claimText: true, supportingExcerpt: true } },
        },
      }),
      prisma.practiceSession.findMany({
        where: { userId, goalId: goal.id },
        orderBy: { startedAt: "desc" },
        take: 20,
        select: { id: true, module: true, title: true, status: true, startedAt: true, _count: { select: { attempts: true } } },
      }),
    ]);

    const completed = tasks.filter((task) => task.status === "completed").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    const nextTasks = tasks.filter((task) => task.status !== "completed").slice(0, 5);
    const practiceSessions = sessions.length;
    const practiceAttempts = sessions.reduce((sum, session) => sum + session._count.attempts, 0);
    const moduleCounts = Object.entries(sessions.reduce<Record<string, number>>((counts, session) => {
      counts[session.module] = (counts[session.module] ?? 0) + 1;
      return counts;
    }, {})).map(([module, count]) => ({ module, count }));

    return NextResponse.json({
      goal,
      evidence: claims,
      roadmap: {
        total: tasks.length,
        completed,
        inProgress,
        percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
        nextTasks,
      },
      practice: { sessions: practiceSessions, attempts: practiceAttempts, moduleCounts },
      methodology: "This workspace joins only the signed-in user's selected career goal, exact company-and-role moderator-approved evidence, its existing roadmap tasks, and practice sessions explicitly linked to that goal. Completed tasks are user-reported; practice counts are activity, not proof of skill. No hiring prediction or automatic answer grading is performed.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Company preparation workspace is unavailable. Check database configuration and migrations." }, { status: 503 });
  }
}

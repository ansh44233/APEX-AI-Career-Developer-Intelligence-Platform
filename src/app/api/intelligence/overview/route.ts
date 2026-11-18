import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A transparent, descriptive snapshot of saved activity.
 * It deliberately does not invent a readiness score or infer skill from
 * unscored attempts. Scores are included only when explicitly stored.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const rateLimitResponse = await enforceUserRateLimit(userId, "intelligence-overview-read", 30, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const [sessionCounts, attemptSummary, moduleBreakdown, recentActivity, skillGroups] =
      await Promise.all([
        prisma.practiceSession.groupBy({
          by: ["status"],
          where: { userId },
          _count: { _all: true },
        }),
        prisma.practiceAttempt.aggregate({
          where: { session: { userId } },
          _count: { _all: true },
          _avg: { score: true },
        }),
        prisma.practiceSession.groupBy({
          by: ["module"],
          where: { userId },
          _count: { _all: true },
        }),
        prisma.practiceSession.findMany({
          where: { userId, startedAt: { gte: since } },
          orderBy: { startedAt: "asc" },
          select: { id: true, module: true, title: true, status: true, startedAt: true, _count: { select: { attempts: true } } },
          take: 100,
        }),
        prisma.skillAssessment.groupBy({
          by: ["skillKey"],
          where: { userId },
          _avg: { rating: true },
          _count: { _all: true },
          _max: { assessedAt: true },
        }),
      ]);

    const countFor = (status: string) =>
      sessionCounts.find((item) => item.status === status)?._count._all ?? 0;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      methodology: {
        readinessScore: null,
        note: "No readiness score is shown until APEX has a validated scoring model. Session counts describe activity, not proficiency.",
        averageScoreNote: "Average includes only attempt scores explicitly saved by a scoring workflow.",
      },
      totals: {
        sessions: sessionCounts.reduce((sum, item) => sum + item._count._all, 0),
        completedSessions: countFor("completed"),
        inProgressSessions: countFor("in_progress"),
        abandonedSessions: countFor("abandoned"),
        attempts: attemptSummary._count._all,
        averageRecordedScore: attemptSummary._avg.score === null ? null : Number(attemptSummary._avg.score),
      },
      moduleBreakdown: moduleBreakdown.map((item) => ({ module: item.module, sessions: item._count._all })),
      recentActivity,
      skillAssessments: skillGroups.map((item) => ({
        skillKey: item.skillKey,
        averageRating: item._avg.rating,
        assessmentCount: item._count._all,
        lastAssessedAt: item._max.assessedAt,
      })),
      windowStart: since.toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Intelligence data is unavailable. Check database configuration." },
      { status: 503 },
    );
  }
}

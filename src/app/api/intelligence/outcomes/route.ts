import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const rateLimitResponse = await enforceUserRateLimit(userId, "intelligence-outcomes-read", 20, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const now = new Date();
    const since30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [goals, assessments, sessions, jobs, actions, events] = await Promise.all([
      prisma.careerGoal.findMany({
        where: { userId },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 50,
        select: {
          id: true, targetRole: true, targetCompany: true, targetDate: true, status: true, createdAt: true, updatedAt: true,
          roadmapTasks: { take: 200, orderBy: { sortOrder: "asc" }, select: { id: true, status: true, title: true } },
        },
      }),
      prisma.skillAssessment.findMany({
        where: { userId, goalId: { not: null } },
        orderBy: [{ assessedAt: "desc" }, { id: "desc" }],
        take: 500,
        select: { id: true, goalId: true, skillKey: true, rating: true, assessedAt: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId, goalId: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 500,
        select: { id: true, goalId: true, module: true, status: true, startedAt: true, completedAt: true, _count: { select: { attempts: true } } },
      }),
      prisma.jobApplication.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: {
          id: true, goalId: true, company: true, role: true, status: true, updatedAt: true,
          preparationTasks: { select: { status: true } },
        },
      }),
      prisma.careerRecommendationAction.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 500,
        select: { id: true, goalId: true, jobId: true, status: true, completedAt: true, createdAt: true },
      }),
      prisma.jobTimelineEvent.findMany({
        where: { userId },
        orderBy: { scheduledAt: "desc" },
        take: 500,
        select: { id: true, jobId: true, status: true, eventType: true, scheduledAt: true, completedAt: true },
      }),
    ]);

    const goalOutcomes = goals.map(goal => {
      const goalAssessments = assessments.filter(item => item.goalId === goal.id);
      const ratingHistory = new Map<string, Array<{ rating: number; assessedAt: Date }>>();
      for (const item of goalAssessments) {
        const history = ratingHistory.get(item.skillKey) ?? [];
        history.push({ rating: item.rating, assessedAt: item.assessedAt });
        ratingHistory.set(item.skillKey, history);
      }
      let higher = 0, lower = 0, unchanged = 0, comparable = 0;
      const ratingChanges = [...ratingHistory.entries()].map(([skillKey, history]) => {
        if (history.length >= 2) {
          const first = history[history.length - 1].rating;
          const latest = history[0].rating;
          comparable++;
          if (latest > first) higher++;
          else if (latest < first) lower++;
          else unchanged++;
          return { skillKey, firstRating: first, latestRating: latest, assessments: history.length, change: latest > first ? "higher_self_rating" : latest < first ? "lower_self_rating" : "unchanged" };
        }
        return { skillKey, firstRating: null, latestRating: history[0]?.rating ?? null, assessments: history.length, change: "not_comparable" };
      });

      const goalSessions = sessions.filter(item => item.goalId === goal.id);
      const goalJobs = jobs.filter(item => item.goalId === goal.id);
      const jobIds = new Set(goalJobs.map(item => item.id));
      const goalActions = actions.filter(item => item.goalId === goal.id || (item.jobId !== null && jobIds.has(item.jobId)));
      const goalEvents = events.filter(item => jobIds.has(item.jobId));
      const roadmapTotal = goal.roadmapTasks.length;
      const roadmapCompleted = goal.roadmapTasks.filter(item => item.status === "completed").length;
      const preparation = goalJobs.flatMap(item => item.preparationTasks);
      const prepCompleted = preparation.filter(item => item.status === "completed").length;
      const statusCounts = Object.fromEntries([...new Set(goalJobs.map(item => item.status))].map(status => [status, goalJobs.filter(item => item.status === status).length]));
      const eventCompleted = goalEvents.filter(item => item.status === "completed").length;
      const eventPending = goalEvents.filter(item => item.status === "pending").length;
      const sessionsLast30Days = goalSessions.filter(item => item.startedAt >= since30Days).length;
      const actionCounts = Object.fromEntries(["accepted", "deferred", "dismissed", "completed"].map(status => [status, goalActions.filter(item => item.status === status).length]));
      const practiceModules = [...new Set(goalSessions.map(item => item.module))];

      return {
        goal: { id: goal.id, targetRole: goal.targetRole, targetCompany: goal.targetCompany, targetDate: goal.targetDate?.toISOString() ?? null, status: goal.status, createdAt: goal.createdAt.toISOString(), updatedAt: goal.updatedAt.toISOString() },
        preparation: { roadmapTotal, roadmapCompleted, roadmapPercent: roadmapTotal ? Math.round(roadmapCompleted / roadmapTotal * 100) : null, jobTasksTotal: preparation.length, jobTasksCompleted: prepCompleted, jobTaskPercent: preparation.length ? Math.round(prepCompleted / preparation.length * 100) : null },
        skillRatings: { skillsAssessed: ratingHistory.size, comparableSkills: comparable, higher, lower, unchanged, changes: ratingChanges },
        practice: { sessions: goalSessions.length, attempts: goalSessions.reduce((sum, item) => sum + item._count.attempts, 0), completedSessions: goalSessions.filter(item => item.status === "completed").length, sessionsLast30Days, modules: practiceModules },
        applications: { total: goalJobs.length, byStatus: statusCounts, recent: goalJobs.slice(0, 5).map(item => ({ id: item.id, company: item.company, role: item.role, status: item.status, updatedAt: item.updatedAt.toISOString() })) },
        followThrough: { recommendationActions: actionCounts, timelineEvents: goalEvents.length, timelineCompleted: eventCompleted, timelinePending: eventPending, timelineCompletionPercent: goalEvents.length ? Math.round(eventCompleted / goalEvents.length * 100) : null },
        methodology: {
          skillRatings: "Compares the first and latest recorded self-rating per skill within this goal. A higher rating is not independently verified skill improvement.",
          practice: "Counts only practice sessions explicitly linked to this goal. Activity and attempts are not proof of mastery.",
          preparation: "Roadmap and job preparation completion reflect user-marked task statuses.",
          applications: "Application stages are the statuses entered by the user; they do not imply employer response or conversion probability.",
          followThrough: "Counts recommendation actions linked to this goal or its saved jobs, and timeline events linked to those jobs. Completion is user-recorded.",
        },
      };
    });

    const totals = {
      goals: goalOutcomes.length,
      activeGoals: goalOutcomes.filter(item => item.goal.status === "active").length,
      linkedPracticeSessions: goalOutcomes.reduce((sum, item) => sum + item.practice.sessions, 0),
      linkedApplications: goalOutcomes.reduce((sum, item) => sum + item.applications.total, 0),
      linkedRoadmapTasks: goalOutcomes.reduce((sum, item) => sum + item.preparation.roadmapTotal, 0),
      completedRoadmapTasks: goalOutcomes.reduce((sum, item) => sum + item.preparation.roadmapCompleted, 0),
      completedRecommendationActions: goalOutcomes.reduce((sum, item) => sum + item.followThrough.recommendationActions.completed, 0),
    };

    return NextResponse.json({
      generatedAt: now.toISOString(),
      totals,
      goals: goalOutcomes,
      scope: "Goal-linked records only. General profile assessments and unlinked practice are excluded rather than assigned to a goal.",
      limits: "At most 50 goals, 500 assessments, 500 practice sessions, 100 saved jobs, 500 recommendation actions and 500 timeline events are included. Per-goal roadmap tasks are capped at 200.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Career outcome intelligence is unavailable. Check database configuration and migrations." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reconstructs a private, user-scoped career memory from existing records.
 * It returns structured summaries only; never returns practice answers,
 * resume text, private job notes or assessment evidence notes.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const now = new Date();
    const [goals, assessments, sessions, jobs, upcomingEventCount, overdueEventCount] = await Promise.all([
      prisma.careerGoal.findMany({
        where: { userId },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 30,
        select: {
          id: true, targetRole: true, targetCompany: true, targetDate: true, status: true, updatedAt: true,
          roadmapTasks: { select: { status: true } },
        },
      }),
      prisma.skillAssessment.findMany({
        where: { userId }, orderBy: { assessedAt: "desc" }, take: 500,
        select: { goalId: true, skillKey: true, rating: true, assessedAt: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId }, orderBy: { startedAt: "desc" }, take: 500,
        select: { goalId: true, module: true, status: true, startedAt: true, _count: { select: { attempts: true } } },
      }),
      prisma.jobApplication.findMany({
        where: { userId }, orderBy: { updatedAt: "desc" }, take: 100,
        select: { id: true, goalId: true, company: true, role: true, status: true, updatedAt: true, _count: { select: { preparationTasks: true, timelineEvents: true } } },
      }),
      prisma.jobTimelineEvent.count({ where: { userId, status: "pending", scheduledAt: { gte: now } } }),
      prisma.jobTimelineEvent.count({ where: { userId, status: "pending", scheduledAt: { lt: now } } }),
    ]);

    const latestBySkill = new Map<string, { skillKey: string; rating: number; assessedAt: Date; previousRating: number | null }>();
    for (const item of assessments) {
      const current = latestBySkill.get(item.skillKey);
      if (!current) latestBySkill.set(item.skillKey, { skillKey: item.skillKey, rating: item.rating, assessedAt: item.assessedAt, previousRating: null });
      else if (current.previousRating === null) current.previousRating = item.rating;
    }
    const skills = [...latestBySkill.values()].sort((a, b) => a.skillKey.localeCompare(b.skillKey)).map(item => ({
      skillKey: item.skillKey, latestRating: item.rating, previousRating: item.previousRating,
      change: item.previousRating === null ? "not_comparable" : item.rating > item.previousRating ? "higher_self_rating" : item.rating < item.previousRating ? "lower_self_rating" : "unchanged",
      assessedAt: item.assessedAt.toISOString(),
    }));

    const activeGoals = goals.filter(goal => goal.status === "active");
    const goalMemories = goals.map(goal => {
      const goalSessions = sessions.filter(session => session.goalId === goal.id);
      const goalAssessments = assessments.filter(item => item.goalId === goal.id);
      const latestGoalSkills = new Map<string, number>();
      for (const item of goalAssessments) if (!latestGoalSkills.has(item.skillKey)) latestGoalSkills.set(item.skillKey, item.rating);
      const goalJobs = jobs.filter(job => job.goalId === goal.id);
      const roadmapTotal = goal.roadmapTasks.length;
      const roadmapCompleted = goal.roadmapTasks.filter(task => task.status === "completed").length;
      return {
        id: goal.id, targetRole: goal.targetRole, targetCompany: goal.targetCompany,
        targetDate: goal.targetDate?.toISOString() ?? null, status: goal.status, updatedAt: goal.updatedAt.toISOString(),
        linkedPractice: { sessions: goalSessions.length, attempts: goalSessions.reduce((sum, session) => sum + session._count.attempts, 0), modules: [...new Set(goalSessions.map(session => session.module))] },
        selfAssessments: [...latestGoalSkills.entries()].map(([skillKey, rating]) => ({ skillKey, rating })),
        applications: { total: goalJobs.length, byStatus: Object.fromEntries([...new Set(goalJobs.map(job => job.status))].map(status => [status, goalJobs.filter(job => job.status === status).length])) },
        roadmap: { total: roadmapTotal, completed: roadmapCompleted, completionPercent: roadmapTotal ? Math.round(roadmapCompleted / roadmapTotal * 100) : null },
      };
    });

    const jobStatusCounts = Object.fromEntries([...new Set(jobs.map(job => job.status))].map(status => [status, jobs.filter(job => job.status === status).length]));
    const moduleCounts = new Map<string, number>();
    for (const session of sessions) moduleCounts.set(session.module, (moduleCounts.get(session.module) ?? 0) + 1);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      profile: {
        activeGoals: activeGoals.length, totalGoals: goals.length, savedApplications: jobs.length,
        practiceSessions: sessions.length, savedAttempts: sessions.reduce((sum, session) => sum + session._count.attempts, 0),
        assessedSkills: skills.length, upcomingTimelineActions: upcomingEventCount, overdueTimelineActions: overdueEventCount,
      },
      goals: goalMemories,
      skills,
      applicationPipeline: jobStatusCounts,
      practiceByModule: [...moduleCounts.entries()].map(([module, count]) => ({ module, sessions: count })).sort((a, b) => b.sessions - a.sessions),
      recentApplications: jobs.slice(0, 8).map(job => ({ id: job.id, company: job.company, role: job.role, status: job.status, updatedAt: job.updatedAt.toISOString(), preparationTasks: job._count.preparationTasks, timelineEvents: job._count.timelineEvents })),
      methodology: {
        source: "Existing career goals, user-entered skill assessments, saved practice session metadata, job application metadata, roadmap task statuses and timeline metadata.",
        privacy: "This endpoint does not return resume text, job descriptions, private job notes, practice answer text or skill-assessment evidence notes.",
        limits: "This is a reconstructed summary, not a separate AI memory or proof of skill. Practice counts measure activity. Skill changes compare the two latest saved self-ratings and do not establish objective improvement. Goal-linked metrics include only records explicitly linked to that goal. Results are bounded to the latest 30 goals, 500 assessments, 500 practice sessions and 100 jobs; pending timeline totals use exact database counts.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Career memory is unavailable. Check database configuration and migrations." }, { status: 503 });
  }
}

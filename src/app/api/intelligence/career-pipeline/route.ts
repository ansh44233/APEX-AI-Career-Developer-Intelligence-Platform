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
    const rateLimitResponse = await enforceUserRateLimit(userId, "intelligence-career-pipeline-read", 30, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;
    const now = new Date();
    const [jobGroups, eventGroups, preparationGroups, jobs, upcoming, overdue] = await Promise.all([
      prisma.jobApplication.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } }),
      prisma.jobTimelineEvent.groupBy({ by: ["status", "eventType"], where: { userId }, _count: { _all: true } }),
      prisma.jobPreparationTask.groupBy({ by: ["status"], where: { job: { userId } }, _count: { _all: true } }),
      prisma.jobApplication.findMany({
        where: { userId }, orderBy: { updatedAt: "desc" }, take: 100,
        select: { id: true, company: true, role: true, status: true, updatedAt: true, preparationTasks: { select: { status: true } } },
      }),
      prisma.jobTimelineEvent.findMany({
        where: { userId, status: "pending", scheduledAt: { gte: now } },
        orderBy: { scheduledAt: "asc" }, take: 8,
        select: { id: true, jobId: true, eventType: true, title: true, scheduledAt: true, job: { select: { company: true, role: true, status: true } } },
      }),
      prisma.jobTimelineEvent.findMany({
        where: { userId, status: "pending", scheduledAt: { lt: now } },
        orderBy: { scheduledAt: "desc" }, take: 5,
        select: { id: true, jobId: true, eventType: true, title: true, scheduledAt: true, job: { select: { company: true, role: true, status: true } } },
      }),
    ]);
    const jobCounts = Object.fromEntries(jobGroups.map(item => [item.status, item._count._all]));
    const eventCounts = Object.fromEntries(eventGroups.map(item => [item.status + ":" + item.eventType, item._count._all]));
    const preparationCounts = Object.fromEntries(preparationGroups.map(item => [item.status, item._count._all]));
    const totalJobs = Object.values(jobCounts).reduce((sum, count) => sum + count, 0);
    const activeJobs = (jobCounts.saved || 0) + (jobCounts.applied || 0) + (jobCounts.interview || 0);
    const totalTasks = Object.values(preparationCounts).reduce((sum, count) => sum + count, 0);
    const completedTasks = preparationCounts.completed || 0;
    const eventTotal = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);
    return NextResponse.json({
      generatedAt: now.toISOString(),
      applications: { total: totalJobs, active: activeJobs, byStatus: jobCounts },
      timeline: {
        total: eventTotal,
        pending: eventGroups.filter(item => item.status === "pending").reduce((sum, item) => sum + item._count._all, 0),
        completed: eventGroups.filter(item => item.status === "completed").reduce((sum, item) => sum + item._count._all, 0),
        byType: Object.fromEntries(["deadline", "follow_up", "interview", "assessment", "other"].map(type => [type, eventGroups.filter(item => item.eventType === type).reduce((sum, item) => sum + item._count._all, 0)])),
        upcomingCount: await prisma.jobTimelineEvent.count({ where: { userId, status: "pending", scheduledAt: { gte: now } } }),
        overdueCount: await prisma.jobTimelineEvent.count({ where: { userId, status: "pending", scheduledAt: { lt: now } } }),
      },
      preparation: { totalTasks, completedTasks, inProgressTasks: preparationCounts.in_progress || 0, todoTasks: preparationCounts.todo || 0, completionPercent: totalTasks ? Math.round(completedTasks / totalTasks * 100) : null },
      recentApplications: jobs.slice(0, 8).map(job => ({
        id: job.id, company: job.company, role: job.role, status: job.status, updatedAt: job.updatedAt,
        preparation: { total: job.preparationTasks.length, completed: job.preparationTasks.filter(task => task.status === "completed").length },
      })),
      upcomingEvents: upcoming,
      overdueEvents: overdue,
      methodology: {
        applications: "Counts are based on saved JobApplication status values. Active includes saved, applied and interview; offers are reported separately.",
        preparation: "Completion is the count of user-marked completed JobPreparationTask records divided by all saved preparation tasks.",
        timeline: "Upcoming and overdue include pending JobTimelineEvent records only. Cancelled and completed events are excluded.",
        limitations: "Descriptive account activity only; no conversion rates, employer response inference, hiring predictions or notification delivery.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Career pipeline analytics are unavailable. Check database configuration and migrations." }, { status: 503 });
  }
}

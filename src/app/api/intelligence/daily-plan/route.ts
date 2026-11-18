import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const DAY = 86400000;

function minutesFor(module: string) {
  if (module.includes("oa-arena")) return 35;
  if (module.includes("system-design")) return 40;
  if (module.includes("project-defense")) return 25;
  if (module.includes("interview")) return 25;
  return 20;
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * DAY);
    const goals = await prisma.careerGoal.findMany({
      where: { userId, status: "active" }, orderBy: { updatedAt: "desc" }, take: 50,
      select: { id: true, targetRole: true, targetCompany: true, targetDate: true },
    });
    const goalIds = goals.map(goal => goal.id);
    const weekStart = new Date(now.getTime() - 7 * DAY);
    const [overdueEvents, upcomingEvents, jobs, tasks, sessions, savedActions] = await Promise.all([
      prisma.jobTimelineEvent.findMany({
        where: { userId, status: "pending", scheduledAt: { lt: now } },
        orderBy: { scheduledAt: "desc" }, take: 20,
        select: { id: true, jobId: true, eventType: true, title: true, scheduledAt: true, job: { select: { goalId: true, company: true, role: true, status: true } } },
      }),
      prisma.jobTimelineEvent.findMany({
        where: { userId, status: "pending", scheduledAt: { gte: now, lte: horizon } },
        orderBy: { scheduledAt: "asc" }, take: 40,
        select: { id: true, jobId: true, eventType: true, title: true, scheduledAt: true, job: { select: { goalId: true, company: true, role: true, status: true } } },
      }),
      prisma.jobApplication.findMany({
        where: { userId, goalId: { in: goalIds }, status: { in: ["saved", "applied", "interview", "offer"] } },
        orderBy: { updatedAt: "desc" }, take: 200,
        select: { id: true, goalId: true, company: true, role: true, status: true, preparationTasks: { where: { status: { not: "completed" } }, orderBy: { sortOrder: "asc" }, take: 5, select: { id: true, title: true, description: true, module: true, status: true } } },
      }),
      prisma.careerRoadmapTask.findMany({
        where: { goalId: { in: goalIds }, status: { not: "completed" } },
        orderBy: [{ status: "asc" }, { sortOrder: "asc" }], take: 1000,
        select: { id: true, goalId: true, title: true, description: true, skillKey: true, module: true, status: true, evidenceClaimId: true, evidenceClaim: { select: { claimType: true, claimText: true, supportingExcerpt: true, capture: { select: { sourceTitle: true, sourceUrl: true, retrievedAt: true } } } } },
      }),
      prisma.practiceSession.findMany({
        where: { userId, goalId: { in: goalIds } }, orderBy: { startedAt: "desc" }, take: 500,
        select: { goalId: true, roadmapTaskId: true, module: true, startedAt: true },
      }),
      prisma.careerRecommendationAction.findMany({
        where: { userId, basis: "daily_plan" }, orderBy: { updatedAt: "desc" }, take: 200,
        select: { sourceKey: true, status: true, dueAt: true, createdAt: true, updatedAt: true },
      }),
    ]);

    const events = [...overdueEvents, ...upcomingEvents];
    const [practiceSessionsThisWeek, completedTimelineThisWeek, completedRoadmapThisWeek, completedJobPrepThisWeek, completedRecommendationsThisWeek] = await Promise.all([
      prisma.practiceSession.count({ where: { userId, startedAt: { gte: weekStart } } }),
      prisma.jobTimelineEvent.count({ where: { userId, status: "completed", completedAt: { gte: weekStart } } }),
      prisma.careerRoadmapTask.count({ where: { goalId: { in: goalIds }, status: "completed", updatedAt: { gte: weekStart } } }),
      prisma.jobPreparationTask.count({ where: { job: { userId }, status: "completed", updatedAt: { gte: weekStart } } }),
      prisma.careerRecommendationAction.count({ where: { userId, status: "completed", completedAt: { gte: weekStart } } }),
    ]);

    const items: Array<{
      id: string; title: string; reason: string; href: string; basis: string;
      goalId?: string; jobId?: string; dueAt: string | null; priority: number;
      urgency: "urgent" | "soon" | "flexible"; estimatedMinutes: number;
      sourceType: string; sourceLabel: string; evidence?: { title: string; url: string; excerpt: string } | null;
    }> = [];

    for (const event of events) {
      const days = Math.ceil((event.scheduledAt.getTime() - now.getTime()) / DAY);
      const overdue = days < 0;
      const priority = overdue ? 120 : days <= 1 ? 115 : days <= 3 ? 100 : 75;
      items.push({
        id: "event_" + event.id, title: (overdue ? "Review overdue: " : "Prepare for: ") + event.title,
        reason: event.job.company + " · " + event.job.role + ". " + (overdue ? "This saved action is overdue; review or reschedule it." : "This saved " + event.eventType.replaceAll("_", " ") + " is scheduled " + (days === 0 ? "today" : "in " + days + " days") + "."),
        href: "/features/application-follow-ups", basis: "timeline", goalId: event.job.goalId ?? undefined,
        jobId: event.jobId, dueAt: event.scheduledAt.toISOString(), priority,
        urgency: overdue || days <= 1 ? "urgent" : days <= 3 ? "soon" : "flexible",
        estimatedMinutes: event.eventType === "interview" ? 45 : 15,
        sourceType: "timeline_event", sourceLabel: event.job.company + " · " + event.eventType.replaceAll("_", " "),
      });
    }

    for (const job of jobs) {
      const next = job.preparationTasks[0];
      if (!next) continue;
      const interviewSoon = events.some(event => event.jobId === job.id && event.eventType === "interview" && event.scheduledAt.getTime() <= now.getTime() + 3 * DAY);
      items.push({
        id: "jobprep_" + next.id, title: next.title,
        reason: job.company + " · " + job.role + ". This is an incomplete task in your saved job-specific preparation checklist." + (interviewSoon ? " An interview event for this application is approaching." : ""),
        href: "/features/job-preparation?jobId=" + job.id, basis: "job_preparation",
        goalId: job.goalId ?? undefined, jobId: job.id, dueAt: null,
        priority: interviewSoon ? 105 : job.status === "interview" ? 90 : job.status === "applied" ? 72 : 55,
        urgency: interviewSoon || job.status === "interview" ? "soon" : "flexible",
        estimatedMinutes: minutesFor(next.module), sourceType: "job_preparation",
        sourceLabel: job.company + " · saved job checklist",
      });
    }

    for (const goal of goals) {
      const candidates = tasks.filter(task => task.goalId === goal.id);
      const inProgress = candidates.find(task => task.status === "in_progress");
      const evidenceTask = candidates.find(task => task.evidenceClaimId);
      const task = evidenceTask ?? inProgress ?? candidates[0];
      if (!task) continue;
      const lastPractice = sessions.find(session => session.goalId === goal.id && session.roadmapTaskId === task.id);
      const daysSincePractice = lastPractice ? Math.floor((now.getTime() - lastPractice.startedAt.getTime()) / DAY) : null;
      const evidence = task.evidenceClaim;
      const daysToTarget = goal.targetDate ? Math.ceil((goal.targetDate.getTime() - now.getTime()) / DAY) : null;
      const priority = evidence ? 92 : task.status === "in_progress" ? 82 : daysToTarget !== null && daysToTarget <= 14 ? 78 : daysSincePractice === null ? 70 : daysSincePractice >= 21 ? 68 : 60;
      items.push({
        id: "roadmap_" + task.id, title: task.title,
        reason: evidence ? "Linked to moderator-approved " + (evidence.claimType === "explicit_requirement" ? "employer requirement" : "employer guidance") + ". Review the source passage, then practise." : task.status === "in_progress" ? "You already started this roadmap task. Continue it before opening another topic." : daysSincePractice === null ? "No practice session is linked to this exact roadmap task yet." : daysSincePractice >= 21 ? "This task has not been practised for " + daysSincePractice + " days." : "This is the next incomplete step in your saved " + goal.targetRole + " roadmap.",
        href: task.module, basis: "roadmap", goalId: goal.id, dueAt: goal.targetDate?.toISOString() ?? null,
        priority, urgency: daysToTarget !== null && daysToTarget <= 3 ? "soon" : "flexible",
        estimatedMinutes: minutesFor(task.module), sourceType: "roadmap_task",
        sourceLabel: (goal.targetCompany ? goal.targetCompany + " · " : "") + goal.targetRole + " roadmap",
        evidence: evidence ? { title: evidence.capture.sourceTitle, url: evidence.capture.sourceUrl, excerpt: evidence.supportingExcerpt } : null,
      });
    }

    const deduped = items.sort((a, b) => b.priority - a.priority || (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"))
      .filter((item, index, all) => all.findIndex(other => other.id === item.id) === index).slice(0, 8);
    return NextResponse.json({
      generatedAt: now.toISOString(), horizonDays: 14, items: deduped,
      summary: { activeGoals: goals.length, upcomingEvents: events.length, linkedApplications: jobs.length, incompleteRoadmapTasks: tasks.length },
      weeklyReview: { since: weekStart.toISOString(), practiceSessions: practiceSessionsThisWeek, completedTimelineEvents: completedTimelineThisWeek, completedRoadmapTasks: completedRoadmapThisWeek, completedJobPreparationTasks: completedJobPrepThisWeek, completedRecommendations: completedRecommendationsThisWeek },
      methodology: "Actions are ranked using saved pending timeline dates, saved application statuses and incomplete preparation tasks, exact goal-linked roadmap tasks, approved evidence links and exact task-linked practice recency. Time estimates are suggestions only.",
      limits: "This is a deterministic daily shortlist, not an AI prediction or scheduled reminder. Only the user's own records are read. No answer text, job descriptions, private notes or assessment evidence notes are returned. No records are changed by generating this plan.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Daily career plan is unavailable. Check database configuration and apply pending migrations." }, { status: 503 });
  }
}

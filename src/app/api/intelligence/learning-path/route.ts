import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 86400000;

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const goals = await prisma.careerGoal.findMany({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, targetRole: true, targetCompany: true, targetDate: true },
    });
    if (!goals.length) {
      return NextResponse.json({
        generatedAt: new Date().toISOString(), paths: [],
        methodology: "Learning sequences are ordered from the user's saved goal roadmap, goal-linked self-assessments and goal-linked practice history.",
        limits: "No career goals are currently active.",
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const goalIds = goals.map(goal => goal.id);
    const [tasks, assessments, sessions] = await Promise.all([
      prisma.careerRoadmapTask.findMany({
        where: { goalId: { in: goalIds } },
        orderBy: [{ goalId: "asc" }, { sortOrder: "asc" }],
        take: 1000,
        select: { id: true, goalId: true, taskKey: true, title: true, description: true, skillKey: true, module: true, phase: true, sortOrder: true, status: true, evidenceClaimId: true },
      }),
      prisma.skillAssessment.findMany({
        where: { userId, goalId: { in: goalIds } },
        orderBy: [{ assessedAt: "desc" }, { id: "desc" }],
        take: 1000,
        select: { goalId: true, skillKey: true, rating: true, assessedAt: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId, goalId: { in: goalIds } },
        orderBy: { startedAt: "desc" },
        take: 500,
        select: { id: true, goalId: true, module: true, title: true, status: true, startedAt: true, _count: { select: { attempts: true } } },
      }),
    ]);

    const now = new Date();
    const paths = goals.map(goal => {
      const goalTasks = tasks.filter(task => task.goalId === goal.id);
      const latestRatings = new Map<string, { rating: number; assessedAt: Date }>();
      for (const assessment of assessments) {
        if (assessment.goalId === goal.id && !latestRatings.has(assessment.skillKey)) {
          latestRatings.set(assessment.skillKey, { rating: assessment.rating, assessedAt: assessment.assessedAt });
        }
      }
      const goalSessions = sessions.filter(session => session.goalId === goal.id);
      const lastByModule = new Map<string, Date>();
      for (const session of goalSessions) {
        const current = lastByModule.get(session.module);
        if (!current || session.startedAt > current) lastByModule.set(session.module, session.startedAt);
      }

      const candidates = goalTasks.filter(task => task.status !== "completed").map(task => {
        const rating = latestRatings.get(task.skillKey);
        const lastPractice = lastByModule.get(task.module) ?? null;
        const daysSincePractice = lastPractice ? Math.max(0, Math.floor((now.getTime() - lastPractice.getTime()) / DAY)) : null;
        let priority = 40;
        let reason = "This is the next incomplete step in your saved role roadmap.";
        if (task.evidenceClaimId) {
          priority = 95;
          reason = "This task is linked to moderator-approved company evidence. Review its source passage before general practice.";
        }
        if (rating && rating.rating <= 2) {
          priority = Math.max(priority, 90);
          reason = "Your latest goal-linked self-rating for " + task.skillKey.replaceAll("_", " ") + " is " + rating.rating + "/5. Focus here, practise, then reassess.";
        } else if (!rating && task.taskKey === "baseline") {
          priority = Math.max(priority, 88);
          reason = "Establish a goal-specific baseline before choosing which skills need the most work.";
        } else if (!rating) {
          priority = Math.max(priority, 68);
          reason = "No self-assessment is recorded for " + task.skillKey.replaceAll("_", " ") + " on this goal. Build a baseline while working through this step.";
        }
        if (daysSincePractice === null) {
          priority += 8;
          if (!rating || rating.rating > 2) reason += " There is no linked practice session in this module yet.";
        } else if (daysSincePractice >= 21) {
          priority += 12;
          reason += " Your last linked session in this module was " + daysSincePractice + " days ago.";
        }
        if (task.status === "in_progress") priority += 15;
        return {
          id: task.id, taskKey: task.taskKey, title: task.title, description: task.description,
          skillKey: task.skillKey, module: task.module, phase: task.phase, status: task.status,
          priority, reason, latestSelfRating: rating?.rating ?? null,
          lastPractisedAt: lastPractice?.toISOString() ?? null,
          daysSincePractice, evidenceBacked: Boolean(task.evidenceClaimId),
        };
      }).sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));

      return {
        goal: { ...goal, targetDate: goal.targetDate?.toISOString() ?? null },
        progress: {
          totalTasks: goalTasks.length,
          completedTasks: goalTasks.filter(task => task.status === "completed").length,
          inProgressTasks: goalTasks.filter(task => task.status === "in_progress").length,
        },
        practice: {
          linkedSessions: goalSessions.length,
          attempts: goalSessions.reduce((sum, session) => sum + session._count.attempts, 0),
          modules: [...new Set(goalSessions.map(session => session.module))],
        },
        assessedSkillCount: latestRatings.size,
        nextSteps: candidates.slice(0, 6),
      };
    });

    return NextResponse.json({
      generatedAt: now.toISOString(),
      paths,
      methodology: "For each active goal, incomplete roadmap tasks are prioritised using exact skill-key matches to the latest goal-linked self-rating, approved evidence links, task status and recency of goal-linked practice in the task's module. Priority values only order suggestions; they are not readiness or proficiency scores.",
      limits: "Uses up to 50 active goals, 1,000 roadmap tasks, 1,000 goal-linked self-assessments and 500 goal-linked practice sessions. Only saved sessions explicitly linked to a goal count. A task without a matching skill assessment is treated as unassessed, not as a weakness.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Personalised learning paths are unavailable. Check database configuration and apply pending migrations." }, { status: 503 });
  }
}

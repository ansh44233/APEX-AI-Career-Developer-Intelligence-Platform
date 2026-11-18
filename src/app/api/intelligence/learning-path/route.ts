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
    const [tasks, assessments, sessions, practiceAttempts] = await Promise.all([
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
        select: { id: true, goalId: true, roadmapTaskId: true, module: true, title: true, status: true, startedAt: true, _count: { select: { attempts: true } } },
      }),
      prisma.practiceAttempt.findMany({
        where: { session: { userId, goalId: { in: goalIds }, roadmapTaskId: { not: null } } },
        orderBy: { createdAt: "desc" }, take: 1000,
        select: { score: true, feedbackJson: true, createdAt: true, session: { select: { roadmapTaskId: true } } },
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
        const taskSessions = goalSessions.filter(session => session.roadmapTaskId === task.id);
        const taskAttempts = taskSessions.reduce((sum, session) => sum + session._count.attempts, 0);
        const lastTaskPractice = taskSessions[0]?.startedAt ?? null;
        const taskEvaluations = practiceAttempts.filter(attempt => attempt.session.roadmapTaskId === task.id && attempt.feedbackJson !== null && typeof attempt.feedbackJson === "object" && !Array.isArray(attempt.feedbackJson) && (attempt.feedbackJson as Record<string, unknown>).source === "learner_self_evaluation");
        const taskScores = taskEvaluations.map(attempt => Number(attempt.score)).filter(Number.isFinite);
        const latestScore = taskScores[0] ?? null;
        const previousScore = taskScores[1] ?? null;
        const evaluationTrend = latestScore === null || previousScore === null ? "insufficient_data" : latestScore > previousScore ? "higher_self_rating" : latestScore < previousScore ? "lower_self_rating" : "unchanged";
        if (latestScore !== null && latestScore <= 2.5) {
          priority += 18;
          reason += " Your latest learner-entered rubric average for this exact task is " + latestScore.toFixed(2) + "/5; review your recorded improvement areas before another attempt.";
        } else if (evaluationTrend === "lower_self_rating") {
          priority += 8;
          reason += " Your latest self-rating is lower than the previous recorded evaluation; revisit the saved feedback before continuing.";
        }
        return {
          id: task.id, taskKey: task.taskKey, title: task.title, description: task.description,
          skillKey: task.skillKey, module: task.module, phase: task.phase, status: task.status,
          priority, reason, latestSelfRating: rating?.rating ?? null,
          lastPractisedAt: lastPractice?.toISOString() ?? null,
          daysSincePractice, evidenceBacked: Boolean(task.evidenceClaimId),
          taskPractice: { sessions: taskSessions.length, attempts: taskAttempts, lastPractisedAt: lastTaskPractice?.toISOString() ?? null },
          evaluation: { count: taskEvaluations.length, averageSelfRating: taskScores.length ? Math.round(taskScores.reduce((sum, value) => sum + value, 0) / taskScores.length * 100) / 100 : null, latestSelfRating: latestScore, trend: evaluationTrend },
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
      methodology: "For each active goal, incomplete roadmap tasks are prioritised using exact skill-key matches to the latest goal-linked self-rating, approved evidence links, task status, recency of goal-linked module practice and task-linked learner evaluation history. Practice sessions can also be linked to the exact roadmap task, allowing task-specific session and attempt counts. Priority values only order suggestions; they are not readiness or proficiency scores.",
      limits: "Uses up to 50 active goals, 1,000 roadmap tasks, 1,000 goal-linked self-assessments, 500 goal-linked practice sessions and 1,000 task-linked practice attempts. Evaluation signals include only attempts explicitly saved with a learner self-evaluation. Only saved sessions explicitly linked to a goal count; task-level practice counts include only sessions linked to that exact roadmap task. A task without a matching skill assessment is treated as unassessed, not as a weakness.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Personalised learning paths are unavailable. Check database configuration and apply pending migrations." }, { status: 503 });
  }
}

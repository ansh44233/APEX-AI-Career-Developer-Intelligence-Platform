import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RubricItem = { key: string; rating: number; note?: string };
type Evaluation = {
  source?: string;
  rubric?: RubricItem[];
  strengths?: string;
  improvementAreas?: string;
  nextAction?: string;
  evaluatedAt?: string;
};

function cleanTheme(value: string) {
  return value.trim().replace(/^[-*•\s]+/, "").replace(/\s+/g, " ").replace(/[.!?]+$/, "").slice(0, 180);
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const goals = await prisma.careerGoal.findMany({
      where: { userId, status: "active" }, orderBy: { updatedAt: "desc" }, take: 50,
      select: { id: true, targetRole: true, targetCompany: true },
    });
    if (!goals.length) return NextResponse.json({
      generatedAt: new Date().toISOString(), goals: [],
      methodology: "Skill histories use only exact skill keys on goal-owned roadmap tasks, latest goal-linked self-assessments and task-linked learner evaluations.",
      limits: "No active career goals.",
    }, { headers: { "Cache-Control": "no-store" } });

    const goalIds = goals.map(goal => goal.id);
    const [tasks, assessments, attempts] = await Promise.all([
      prisma.careerRoadmapTask.findMany({
        where: { goalId: { in: goalIds } }, orderBy: [{ goalId: "asc" }, { sortOrder: "asc" }], take: 1000,
        select: { id: true, goalId: true, skillKey: true, title: true, status: true, module: true },
      }),
      prisma.skillAssessment.findMany({
        where: { userId, goalId: { in: goalIds } }, orderBy: [{ assessedAt: "desc" }, { id: "desc" }], take: 1000,
        select: { goalId: true, skillKey: true, rating: true, assessedAt: true },
      }),
      prisma.practiceAttempt.findMany({
        where: { session: { userId, goalId: { in: goalIds }, roadmapTaskId: { not: null } } },
        orderBy: { createdAt: "desc" }, take: 1500,
        select: { id: true, score: true, feedbackJson: true, createdAt: true, session: { select: { goalId: true, roadmapTaskId: true, module: true } } },
      }),
    ]);

    const result = goals.map(goal => {
      const goalTasks = tasks.filter(task => task.goalId === goal.id);
      const skills = [...new Set(goalTasks.map(task => task.skillKey))];
      const skillHistory = skills.map(skillKey => {
        const relatedTasks = goalTasks.filter(task => task.skillKey === skillKey);
        const taskIds = new Set(relatedTasks.map(task => task.id));
        const ratingHistory = assessments.filter(item => item.goalId === goal.id && item.skillKey === skillKey);
        const evaluations = attempts.filter(item =>
          item.session.goalId === goal.id && item.session.roadmapTaskId !== null && taskIds.has(item.session.roadmapTaskId) &&
          item.feedbackJson !== null && typeof item.feedbackJson === "object" && !Array.isArray(item.feedbackJson) &&
          "source" in item.feedbackJson && item.feedbackJson.source === "learner_self_evaluation"
        );
        const parsed = evaluations.map(item => ({ ...item, evaluation: item.feedbackJson as Evaluation }));
        const rubricMap = new Map<string, { ratings: number[]; count: number }>();
        for (const item of parsed) for (const dimension of item.evaluation.rubric ?? []) {
          if (!Number.isFinite(dimension.rating) || dimension.rating < 1 || dimension.rating > 5) continue;
          const entry = rubricMap.get(dimension.key) ?? { ratings: [], count: 0 };
          entry.ratings.push(dimension.rating); entry.count++;
          rubricMap.set(dimension.key, entry);
        }
        const themes = new Map<string, number>();
        for (const item of parsed) {
          const raw = item.evaluation.improvementAreas ?? "";
          for (const part of raw.split(/[\n;]+/)) {
            const theme = cleanTheme(part);
            if (theme.length < 4) continue;
            const key = theme.toLocaleLowerCase();
            themes.set(key, (themes.get(key) ?? 0) + 1);
          }
        }
        const latestEvaluation = parsed[0]?.evaluation ?? null;
        const latestRating = ratingHistory[0] ?? null;
        const latestTaskScore = parsed[0]?.score === null || parsed[0]?.score === undefined ? null : Number(parsed[0].score);
        const scoreHistory = parsed.map(item => item.score === null ? null : Number(item.score)).filter((score): score is number => score !== null && Number.isFinite(score));
        const previousScore = scoreHistory[1] ?? null;
        const trend = latestTaskScore === null || previousScore === null ? "insufficient_data" :
          latestTaskScore > previousScore ? "higher_self_rating" :
          latestTaskScore < previousScore ? "lower_self_rating" : "unchanged";
        const taskPracticeCount = parsed.length;
        return {
          skillKey,
          roadmapTasks: relatedTasks.length,
          completedTasks: relatedTasks.filter(task => task.status === "completed").length,
          openTasks: relatedTasks.filter(task => task.status !== "completed").length,
          modules: [...new Set(relatedTasks.map(task => task.module))],
          selfAssessment: {
            latestRating: latestRating?.rating ?? null,
            assessedAt: latestRating?.assessedAt.toISOString() ?? null,
            recordedRatings: ratingHistory.length,
          },
          practice: {
            evaluatedAttempts: taskPracticeCount,
            latestRubricAverage: latestTaskScore,
            averageRubricAverage: scoreHistory.length ? Math.round(scoreHistory.reduce((sum, value) => sum + value, 0) / scoreHistory.length * 100) / 100 : null,
            trend,
            lastEvaluatedAt: parsed[0]?.createdAt.toISOString() ?? null,
            rubricDimensions: [...rubricMap.entries()].map(([key, value]) => ({
              key, averageRating: Math.round(value.ratings.reduce((sum, rating) => sum + rating, 0) / value.ratings.length * 100) / 100,
              evaluations: value.count,
            })).sort((a, b) => a.averageRating - b.averageRating),
            recurringImprovementThemes: [...themes.entries()].filter(([, count]) => count >= 2)
              .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([theme, count]) => ({ theme, occurrences: count })),
            latestStrengths: latestEvaluation?.strengths ?? "",
            latestImprovementAreas: latestEvaluation?.improvementAreas ?? "",
            latestNextAction: latestEvaluation?.nextAction ?? "",
          },
        };
      }).sort((a, b) => (a.practice.latestRubricAverage ?? 6) - (b.practice.latestRubricAverage ?? 6));

      return {
        goal: { id: goal.id, targetRole: goal.targetRole, targetCompany: goal.targetCompany },
        totals: {
          skillsTracked: skillHistory.length,
          assessedSkills: skillHistory.filter(item => item.selfAssessment.latestRating !== null).length,
          skillsWithEvaluations: skillHistory.filter(item => item.practice.evaluatedAttempts > 0).length,
          evaluatedAttempts: skillHistory.reduce((sum, item) => sum + item.practice.evaluatedAttempts, 0),
        },
        skills: skillHistory,
      };
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(), goals: result,
      methodology: "Skills are grouped by exact skillKey from roadmap tasks. Self-assessment history is separate from learner-entered practice rubric history. Rubric dimension averages and recurring improvement themes are descriptive summaries; recurring themes are exact case-insensitive text matches, not semantic AI analysis.",
      limits: "Uses up to 50 active goals, 1,000 roadmap tasks, 1,000 goal-linked self-assessments and 1,500 task-linked attempts. Only attempts linked to the exact roadmap task are included. Attempt answers are not returned.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Skill mastery intelligence is unavailable. Check database configuration and pending migrations." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function mapClaim(text: string) {
  const value = text.toLowerCase();
  if (/sql|database|data model|query/.test(value)) return { skill: "databases", module: "/features/system-design" };
  if (/algorithm|data structure|coding|programming|python|java|javascript|typescript/.test(value)) return { skill: "problem_solving", module: "/features/oa-arena" };
  if (/api|security|authentication|authorization|network|cloud|reliab|distributed|architecture|scalab/.test(value)) return { skill: "system_design", module: "/features/system-design" };
  if (/react|frontend|front end|ui|accessibility|browser/.test(value)) return { skill: "react", module: "/features/project-defense" };
  if (/communication|collaborat|leadership|behavio|explain|teamwork/.test(value)) return { skill: "communication", module: "/features/interview-lab" };
  return { skill: "unmapped", module: "/features/company-intelligence" };
}

type RubricEntry = { key: string; rating: number };
type Evaluation = { source?: string; rubric?: RubricEntry[]; improvementAreas?: string; nextAction?: string };

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const goals = await prisma.careerGoal.findMany({
      where: { userId, status: "active" }, orderBy: { updatedAt: "desc" }, take: 50,
      select: { id: true, targetRole: true, targetCompany: true, targetDate: true },
    });
    if (!goals.length) return NextResponse.json({
      generatedAt: new Date().toISOString(), goals: [],
      methodology: {
        links: "Only records explicitly linked to an active goal are connected. Unlinked activity is not silently assigned.",
        mapping: "Company claims are moderator-approved and exact normalized company/role matches. Skill and practice links use exact roadmap skill keys.",
        limits: "This is a descriptive graph, not a proficiency or hiring prediction.",
      },
    }, { headers: { "Cache-Control": "no-store" } });

    const goalIds = goals.map(goal => goal.id);
    const [assessments, sessions, attempts, jobs, recommendationActions] = await Promise.all([
      prisma.skillAssessment.findMany({
        where: { userId, OR: [{ goalId: { in: goalIds } }, { goalId: null }] },
        orderBy: { assessedAt: "desc" }, take: 1000,
        select: { goalId: true, skillKey: true, rating: true, assessedAt: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId, goalId: { in: goalIds } }, orderBy: { startedAt: "desc" }, take: 1000,
        select: { id: true, goalId: true, roadmapTaskId: true, module: true, status: true, startedAt: true, _count: { select: { attempts: true } } },
      }),
      prisma.practiceAttempt.findMany({
        where: { session: { userId, goalId: { in: goalIds }, roadmapTaskId: { not: null } } },
        orderBy: { createdAt: "desc" }, take: 2000,
        select: { id: true, score: true, feedbackJson: true, createdAt: true, session: { select: { goalId: true, roadmapTaskId: true } } },
      }),
      prisma.jobApplication.findMany({
        where: { userId, goalId: { in: goalIds } }, orderBy: { updatedAt: "desc" }, take: 200,
        select: { id: true, goalId: true, company: true, role: true, status: true, updatedAt: true, _count: { select: { preparationTasks: true, timelineEvents: true } } },
      }),
      prisma.careerRecommendationAction.findMany({
        where: { userId, goalId: { in: goalIds } }, orderBy: { updatedAt: "desc" }, take: 500,
        select: { id: true, goalId: true, jobId: true, roadmapTaskId: true, title: true, reason: true, href: true, status: true, dueAt: true, updatedAt: true },
      }),
    ]);

    const graph = await Promise.all(goals.map(async goal => {
      const goalAssessments = assessments.filter(item => item.goalId === goal.id || item.goalId === null);
      const latestAssessments = new Map<string, typeof goalAssessments[number]>();
      for (const item of goalAssessments) if (!latestAssessments.has(item.skillKey)) latestAssessments.set(item.skillKey, item);

      const goalSessions = sessions.filter(item => item.goalId === goal.id);
      const goalJobs = jobs.filter(item => item.goalId === goal.id);
      const goalActions = recommendationActions.filter(item => item.goalId === goal.id);
      const [claims, tasks, jobPrepTasks] = await Promise.all([
        goal.targetCompany ? prisma.companyEvidenceClaim.findMany({
          where: { status: "approved", company: goal.targetCompany },
          orderBy: { reviewedAt: "desc" }, take: 100,
          select: { id: true, role: true, claimType: true, claimText: true, supportingExcerpt: true, capture: { select: { sourceTitle: true, sourceUrl: true, retrievedAt: true, contentHash: true } } },
        }) : Promise.resolve([]),
        prisma.careerRoadmapTask.findMany({
          where: { goalId: goal.id }, orderBy: { sortOrder: "asc" }, take: 300,
          select: { id: true, title: true, skillKey: true, module: true, status: true, evidenceClaimId: true },
        }),
        goalJobs.length ? prisma.jobPreparationTask.findMany({
          where: { jobId: { in: goalJobs.map(job => job.id) } }, orderBy: { sortOrder: "asc" }, take: 1000,
          select: { id: true, jobId: true, skillKey: true, title: true, module: true, status: true },
        }) : Promise.resolve([]),
      ]);

      const matchingClaims = claims.filter(claim => normalize(claim.role) === normalize(goal.targetRole)).map(claim => ({
        ...claim, mapping: mapClaim(claim.claimText + " " + claim.supportingExcerpt),
      }));
      const taskIds = new Set(tasks.map(task => task.id));
      const skillKeys = [...new Set([...tasks.map(task => task.skillKey), ...latestAssessments.keys()])];
      const skills = skillKeys.map(skillKey => {
        const skillTasks = tasks.filter(task => task.skillKey === skillKey);
        const skillTaskIds = new Set(skillTasks.map(task => task.id));
        const rating = latestAssessments.get(skillKey);
        const evaluated = attempts.filter(attempt =>
          attempt.session.goalId === goal.id && attempt.session.roadmapTaskId !== null &&
          skillTaskIds.has(attempt.session.roadmapTaskId) && attempt.feedbackJson !== null &&
          typeof attempt.feedbackJson === "object" && !Array.isArray(attempt.feedbackJson) &&
          "source" in attempt.feedbackJson && attempt.feedbackJson.source === "learner_self_evaluation"
        );
        const dimensionRatings = new Map<string, number[]>();
        for (const attempt of evaluated) {
          const feedback = attempt.feedbackJson as Evaluation;
          for (const dimension of feedback.rubric ?? []) {
            if (!Number.isFinite(dimension.rating) || dimension.rating < 1 || dimension.rating > 5) continue;
            const values = dimensionRatings.get(dimension.key) ?? [];
            values.push(dimension.rating); dimensionRatings.set(dimension.key, values);
          }
        }
        const rubricDimensions = [...dimensionRatings.entries()].map(([key, values]) => ({
          key, average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 100) / 100, count: values.length,
        })).sort((a, b) => a.average - b.average);
        const scores = evaluated.map(item => item.score === null ? null : Number(item.score)).filter((value): value is number => value !== null && Number.isFinite(value));
        return {
          skillKey, assessment: rating ? { rating: rating.rating, assessedAt: rating.assessedAt.toISOString(), source: rating.goalId === goal.id ? "goal" : "profile" } : null,
          roadmap: { tasks: skillTasks.length, completed: skillTasks.filter(task => task.status === "completed").length, open: skillTasks.filter(task => task.status !== "completed").length },
          practice: { evaluatedAttempts: evaluated.length, latestRubricAverage: scores[0] ?? null, rubricDimensions },
          modules: [...new Set(skillTasks.map(task => task.module))],
        };
      }).sort((a, b) => (a.practice.latestRubricAverage ?? 6) - (b.practice.latestRubricAverage ?? 6));

      const jobPreparation = jobPrepTasks.reduce((acc, task) => {
        acc.total++;
        if (task.status === "completed") acc.completed++;
        else if (task.status === "in_progress") acc.inProgress++;
        return acc;
      }, { total: 0, completed: 0, inProgress: 0 });
      const actionCounts = goalActions.reduce((acc, action) => {
        acc[action.status] = (acc[action.status] ?? 0) + 1; return acc;
      }, {} as Record<string, number>);
      const nextActions = goalActions.filter(action => action.status === "accepted" || action.status === "deferred")
        .slice(0, 5).map(action => ({ id: action.id, title: action.title, reason: action.reason, href: action.href, status: action.status, dueAt: action.dueAt?.toISOString() ?? null, jobId: action.jobId, roadmapTaskId: action.roadmapTaskId }));

      const completedTasks = tasks.filter(task => task.status === "completed").length;
      const inProgressTasks = tasks.filter(task => task.status === "in_progress").length;
      const practiceAttempts = goalSessions.reduce((sum, item) => sum + item._count.attempts, 0);
      return {
        goal: { ...goal, targetDate: goal.targetDate?.toISOString() ?? null },
        nodes: {
          company: goal.targetCompany ? { name: goal.targetCompany, matchedApprovedClaims: matchingClaims.length } : null,
          role: goal.targetRole,
          claims: matchingClaims,
          skills,
          practice: { sessions: goalSessions.length, attempts: practiceAttempts, evaluatedAttempts: attempts.filter(item => item.session.goalId === goal.id && item.feedbackJson !== null && typeof item.feedbackJson === "object" && !Array.isArray(item.feedbackJson) && "source" in item.feedbackJson && item.feedbackJson.source === "learner_self_evaluation").length, modules: [...new Set(goalSessions.map(item => item.module))] },
          roadmap: { total: tasks.length, completed: completedTasks, inProgress: inProgressTasks, tasks },
          applications: {
            total: goalJobs.length,
            byStatus: goalJobs.reduce((acc, job) => { acc[job.status] = (acc[job.status] ?? 0) + 1; return acc; }, {} as Record<string, number>),
            preparation: { ...jobPreparation, todo: jobPreparation.total - jobPreparation.completed - jobPreparation.inProgress },
            items: goalJobs.slice(0, 8).map(job => ({
              id: job.id, company: job.company, role: job.role, status: job.status, updatedAt: job.updatedAt.toISOString(),
              preparationTasks: job._count.preparationTasks, timelineEvents: job._count.timelineEvents,
            })),
          },
          recommendations: { total: goalActions.length, byStatus: actionCounts, next: nextActions },
        },
      };
    }));

    return NextResponse.json({
      generatedAt: new Date().toISOString(), goals: graph,
      methodology: {
        links: "Only records explicitly linked to an active goal are connected. Unlinked assessments are shown separately as profile context. Practice is linked through the exact roadmap task ID; job applications and recommendations must reference the goal. Unlinked activity is not silently assigned.",
        mapping: "Company claims are moderator-approved and exact normalized company/role matches. Practice evaluations are learner-entered reflections, not objective grades.",
        limits: "Reads are bounded to 50 goals, 1,000 assessments, 1,000 sessions, 2,000 task-linked attempts, 200 applications, 1,000 job preparation tasks, 500 recommendation actions, 100 approved claims per goal and 300 roadmap tasks per goal. The graph describes saved records and does not infer proficiency, hiring probability or interview outcomes. Answer text, job descriptions, private notes and assessment evidence notes are not returned.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Career intelligence graph is unavailable. Check database configuration and apply migrations." }, { status: 503 });
  }
}

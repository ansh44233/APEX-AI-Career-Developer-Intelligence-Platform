import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\\s+/g, " ");
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

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const [goals, assessments, sessions] = await Promise.all([
      prisma.careerGoal.findMany({
        where: { userId, status: "active" },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: { id: true, targetRole: true, targetCompany: true, targetDate: true },
      }),
      prisma.skillAssessment.findMany({
        where: { userId },
        orderBy: { assessedAt: "desc" },
        take: 500,
        select: { goalId: true, skillKey: true, rating: true, assessedAt: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 500,
        select: { id: true, goalId: true, module: true, status: true, startedAt: true, _count: { select: { attempts: true } } },
      }),
    ]);

    const graph = await Promise.all(goals.map(async (goal) => {
      const goalAssessments = assessments.filter((item) => item.goalId === goal.id || item.goalId === null);
      const latest = new Map<string, typeof goalAssessments[number]>();
      for (const item of goalAssessments) if (!latest.has(item.skillKey)) latest.set(item.skillKey, item);
      const goalSessions = sessions.filter((item) => item.goalId === goal.id);
      const [claims, tasks] = goal.targetCompany ? await Promise.all([
        prisma.companyEvidenceClaim.findMany({
          where: { status: "approved", company: goal.targetCompany },
          orderBy: { reviewedAt: "desc" },
          take: 100,
          select: { id: true, role: true, claimType: true, claimText: true, supportingExcerpt: true, capture: { select: { sourceTitle: true, sourceUrl: true, retrievedAt: true, contentHash: true } } },
        }),
        prisma.careerRoadmapTask.findMany({
          where: { goalId: goal.id },
          orderBy: { sortOrder: "asc" },
          take: 200,
          select: { id: true, title: true, skillKey: true, module: true, status: true, evidenceClaimId: true },
        }),
      ]) : [
        [],
        await prisma.careerRoadmapTask.findMany({
          where: { goalId: goal.id },
          orderBy: { sortOrder: "asc" },
          take: 200,
          select: { id: true, title: true, skillKey: true, module: true, status: true, evidenceClaimId: true },
        }),
      ];
      const roleKey = normalize(goal.targetRole);
      const matchingClaims = claims.filter((claim) => normalize(claim.role) === roleKey).map((claim) => ({
        ...claim,
        mapping: mapClaim(claim.claimText + " " + claim.supportingExcerpt),
      }));
      const assessedSkills = [...latest.entries()].map(([skillKey, item]) => ({ skillKey, rating: item.rating, assessedAt: item.assessedAt.toISOString() }));
      const completedTasks = tasks.filter((task) => task.status === "completed").length;
      const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
      const practiceAttempts = goalSessions.reduce((sum, item) => sum + item._count.attempts, 0);
      return {
        goal: { ...goal, targetDate: goal.targetDate?.toISOString() ?? null },
        nodes: {
          company: goal.targetCompany ? { name: goal.targetCompany, matchedApprovedClaims: matchingClaims.length } : null,
          role: goal.targetRole,
          claims: matchingClaims,
          skills: assessedSkills,
          practice: { sessions: goalSessions.length, attempts: practiceAttempts, modules: [...new Set(goalSessions.map((item) => item.module))] },
          roadmap: { total: tasks.length, completed: completedTasks, inProgress: inProgressTasks, tasks },
        },
      };
    }));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      goals: graph,
      methodology: {
        links: "Company claims are linked only by exact normalized company and role labels. Skill assessments are user-entered and scoped to the goal plus unlinked profile assessments. Practice activity includes only sessions explicitly linked to that goal.",
        mapping: "Claim-to-module links use transparent keyword rules. Unmapped claims link back to Company Intelligence for manual review.",
        limits: "This graph describes saved data and approved evidence; it does not infer proficiency, hiring probability, or interview outcomes. A goal with no linked practice sessions may still have practice in sessions not associated with that goal.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Career intelligence graph is unavailable. Check database configuration and apply migrations." }, { status: 503 });
  }
}

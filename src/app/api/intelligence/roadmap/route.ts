import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RoadmapSeed = { key: string; title: string; description: string; skill: string; module: string; phase: string };

const shared: RoadmapSeed[] = [
  { key: "baseline", title: "Establish your baseline", description: "Review the role expectations and record honest starting self-ratings for the skills in this plan.", skill: "communication", module: "/features/readiness-engine", phase: "01 · Baseline" },
  { key: "core-fundamentals", title: "Strengthen core fundamentals", description: "Choose one foundational concept, explain it in your own words, and save a practice attempt with evidence.", skill: "core_cs", module: "/features/interview-lab", phase: "02 · Fundamentals" },
  { key: "problem-practice", title: "Build problem-solving consistency", description: "Complete a small set of problems, write down your approach, and review edge cases before comparing solutions.", skill: "problem_solving", module: "/features/oa-arena", phase: "03 · Applied practice" },
  { key: "design-exercise", title: "Practise design decisions", description: "Work through a design prompt and document constraints, trade-offs, data flow and failure cases.", skill: "system_design", module: "/features/system-design", phase: "03 · Applied practice" },
  { key: "explain-work", title: "Explain a project end to end", description: "Prepare a concise walkthrough of one project: problem, architecture, decisions, testing and lessons learned.", skill: "communication", module: "/features/project-defense", phase: "04 · Communication" },
  { key: "mock-interview", title: "Complete a mock interview session", description: "Answer a technical and a behavioural prompt. Review clarity, structure and evidence after the session.", skill: "communication", module: "/features/interview-lab", phase: "04 · Communication" },
  { key: "review-and-adjust", title: "Review progress and adjust the plan", description: "Update self-ratings based on evidence, revisit unfinished topics and choose the next highest-priority skill.", skill: "problem_solving", module: "/features/readiness-engine", phase: "05 · Review" },
];

const roleExtras: Array<{ match: string[]; tasks: RoadmapSeed[] }> = [
  { match: ["frontend", "front-end", "web developer", "ui engineer"], tasks: [
    { key: "role-javascript", title: "Practise JavaScript and TypeScript", description: "Review language fundamentals, async behaviour, typing and common browser APIs through small exercises.", skill: "javascript_typescript", module: "/features/oa-arena", phase: "02 · Role skills" },
    { key: "role-react", title: "Build and explain a component workflow", description: "Practise component boundaries, state, data fetching, accessibility and performance trade-offs.", skill: "react", module: "/features/project-defense", phase: "03 · Role skills" },
  ] },
  { match: ["backend", "back-end", "server engineer", "api developer"], tasks: [
    { key: "role-api", title: "Design a reliable API", description: "Document resource shapes, validation, authorization, pagination, errors and idempotency.", skill: "api_design", module: "/features/system-design", phase: "02 · Role skills" },
    { key: "role-data", title: "Model data and persistence", description: "Practise relational modelling, indexes, transactions, consistency and query trade-offs.", skill: "databases", module: "/features/system-design", phase: "03 · Role skills" },
  ] },
  { match: ["full stack", "full-stack", "fullstack"], tasks: [
    { key: "role-ui", title: "Practise frontend application patterns", description: "Build a small interface and explain component state, accessibility and loading/error states.", skill: "react", module: "/features/project-defense", phase: "02 · Role skills" },
    { key: "role-api", title: "Connect a frontend to a secure API", description: "Design request validation, server-side authorization, persistence and clear failure states.", skill: "api_design", module: "/features/system-design", phase: "03 · Role skills" },
  ] },
  { match: ["data engineer", "analytics engineer", "data platform"], tasks: [
    { key: "role-sql", title: "Practise SQL and query reasoning", description: "Work through joins, aggregation, window functions and explain query plans at a conceptual level.", skill: "sql", module: "/features/oa-arena", phase: "02 · Role skills" },
    { key: "role-pipelines", title: "Design a data pipeline", description: "Describe ingestion, validation, orchestration, retries, data quality and lineage.", skill: "data_modeling", module: "/features/system-design", phase: "03 · Role skills" },
  ] },
  { match: ["devops", "platform engineer", "site reliability", "sre", "cloud engineer"], tasks: [
    { key: "role-linux", title: "Review Linux and networking fundamentals", description: "Practise process, filesystem, DNS, HTTP, TCP and troubleshooting explanations.", skill: "linux", module: "/features/oa-arena", phase: "02 · Role skills" },
    { key: "role-reliability", title: "Design for reliability and observability", description: "Document service-level indicators, monitoring, incident response, deployment and rollback strategy.", skill: "observability", module: "/features/system-design", phase: "03 · Role skills" },
  ] },
  { match: ["mobile", "ios developer", "android developer", "react native"], tasks: [
    { key: "role-platform", title: "Review mobile platform fundamentals", description: "Explain app lifecycle, navigation, permissions, offline behaviour and platform constraints.", skill: "mobile_platforms", module: "/features/project-defense", phase: "02 · Role skills" },
    { key: "role-testing", title: "Plan mobile testing and API integration", description: "Practise test strategy, network failure handling, caching and secure API integration.", skill: "testing", module: "/features/system-design", phase: "03 · Role skills" },
  ] },
];

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\\s+/g, " ");
}

function moduleForClaim(claim: { claimText: string; supportingExcerpt: string; claimType: string }) {
  const text = (claim.claimText + " " + claim.supportingExcerpt).toLowerCase();
  if (/algorithm|data structure|coding|programming|python|java|javascript|typescript|sql/.test(text)) return { skill: /sql/.test(text) ? "sql" : "problem_solving", module: "/features/oa-arena" };
  if (/system design|architecture|scalab|distributed|database|api|security|network|cloud|reliab/.test(text)) return { skill: /database|sql|data model/.test(text) ? "databases" : /api/.test(text) ? "api_design" : "system_design", module: "/features/system-design" };
  if (/react|frontend|front end|ui|accessibility|browser/.test(text)) return { skill: "react", module: "/features/project-defense" };
  if (/communication|collaborat|leadership|behavio|explain|teamwork/.test(text)) return { skill: "communication", module: "/features/interview-lab" };
  return { skill: "communication", module: claim.claimType === "explicit_requirement" ? "/features/interview-lab" : "/features/company-intelligence" };
}

function tasksForRole(role: string): RoadmapSeed[] {
  const normalized = role.toLowerCase();
  const extras = roleExtras.find((item) => item.match.some((term) => normalized.includes(term)))?.tasks ?? [];
  return [...shared.slice(0, 1), ...extras, ...shared.slice(1)];
}

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

    for (const goal of goals) {
      const seeds = tasksForRole(goal.targetRole);
      await prisma.careerRoadmapTask.createMany({
        data: seeds.map((task, index) => ({
          goalId: goal.id,
          taskKey: task.key,
          title: task.title,
          description: task.description,
          skillKey: task.skill,
          module: task.module,
          phase: task.phase,
          sortOrder: index + 1,
        })),
        skipDuplicates: true,
      });

      if (goal.targetCompany) {
        const claims = await prisma.companyEvidenceClaim.findMany({
          where: {
            status: "approved",
            company: goal.targetCompany,
          },
          orderBy: { reviewedAt: "desc" },
          take: 100,
          select: {
            id: true, role: true, claimType: true, claimText: true, supportingExcerpt: true,
          },
        });
        const roleKey = normalized(goal.targetRole);
        const applicable = claims.filter((claim) => normalized(claim.role) === roleKey);
        const evidenceTasks = applicable.map((claim, index) => {
          const mapping = moduleForClaim(claim);
          const shortClaim = claim.claimText.length > 88 ? claim.claimText.slice(0, 85) + "…" : claim.claimText;
          return {
            goalId: goal.id,
            taskKey: "evidence-claim-" + claim.id,
            evidenceClaimId: claim.id,
            title: "Prepare: " + shortClaim,
            description: (claim.claimType === "explicit_requirement" ? "Employer-stated requirement. " : "Employer guidance. ") + claim.claimText + " Supporting source passage: “" + claim.supportingExcerpt + "”",
            skillKey: mapping.skill,
            module: mapping.module,
            phase: "Evidence-backed preparation",
            sortOrder: seeds.length + index + 1,
          };
        });
        if (evidenceTasks.length) await prisma.careerRoadmapTask.createMany({ data: evidenceTasks, skipDuplicates: true });
      }
    }

    const tasks = await prisma.careerRoadmapTask.findMany({
      where: { goal: { userId, status: "active" } },
      orderBy: [{ goalId: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true, goalId: true, taskKey: true, title: true, description: true,
        skillKey: true, module: true, phase: true, sortOrder: true, status: true,
        createdAt: true, updatedAt: true,
        evidenceClaim: { select: { id: true, company: true, role: true, claimType: true, claimText: true, supportingExcerpt: true, capture: { select: { sourceTitle: true, sourceUrl: true, retrievedAt: true, contentHash: true } } } },
        goal: { select: { targetRole: true, targetCompany: true, targetDate: true } },
      },
    });

    const grouped = goals.map((goal) => {
      const goalTasks = tasks.filter((task) => task.goalId === goal.id);
      const completed = goalTasks.filter((task) => task.status === "completed").length;
      return {
        goal: { ...goal, targetDate: goal.targetDate?.toISOString() ?? null },
        tasks: goalTasks.map(({ goal: _goal, ...task }) => task),
        progress: {
          total: goalTasks.length,
          completed,
          inProgress: goalTasks.filter((task) => task.status === "in_progress").length,
          percent: goalTasks.length ? Math.round((completed / goalTasks.length) * 100) : 0,
        },
      };
    });

    return NextResponse.json({
      goals: grouped,
      methodology: "Base roadmap tasks are deterministic role-title templates. Additional evidence-backed tasks are generated only when an active career goal has an exact company and role match to an individually moderator-approved claim. Each such task includes its approved source passage and URL. Skill/module mapping is a transparent keyword heuristic, not an inferred proficiency score. Claims do not guarantee a current vacancy or universal hiring criteria.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Preparation roadmap is unavailable. Check database configuration and apply migrations." }, { status: 503 });
  }
}

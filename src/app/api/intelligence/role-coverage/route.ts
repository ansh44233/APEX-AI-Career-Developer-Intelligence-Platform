import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { enforceUserRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SkillDefinition = { key: string; label: string; modules: string[] };
type RoleTemplate = { id: string; label: string; match: string[]; skills: SkillDefinition[] };

const shared: SkillDefinition[] = [
  { key: "problem_solving", label: "Problem solving", modules: ["/features/oa-arena"] },
  { key: "data_structures_algorithms", label: "Data structures & algorithms", modules: ["/features/oa-arena"] },
  { key: "communication", label: "Technical communication", modules: ["/features/interview-lab", "/features/project-defense"] },
  { key: "core_cs", label: "Core computer science", modules: ["/features/interview-lab"] },
];

const templates: RoleTemplate[] = [
  { id: "frontend", label: "Frontend engineering", match: ["frontend", "front-end", "ui engineer", "web developer"], skills: [
    ...shared,
    { key: "javascript_typescript", label: "JavaScript / TypeScript", modules: ["/features/oa-arena"] },
    { key: "react", label: "React and component design", modules: ["/features/oa-arena", "/features/project-defense"] },
    { key: "web_accessibility", label: "Web accessibility", modules: ["/features/project-defense"] },
    { key: "web_performance", label: "Web performance", modules: ["/features/system-design"] },
  ] },
  { id: "backend", label: "Backend engineering", match: ["backend", "back-end", "server engineer", "api developer"], skills: [
    ...shared,
    { key: "api_design", label: "API design", modules: ["/features/system-design", "/features/project-defense"] },
    { key: "databases", label: "Databases and data modelling", modules: ["/features/system-design"] },
    { key: "system_design", label: "System design", modules: ["/features/system-design"] },
    { key: "security", label: "Application security", modules: ["/features/system-design", "/features/project-defense"] },
  ] },
  { id: "fullstack", label: "Full-stack engineering", match: ["full stack", "full-stack", "fullstack"], skills: [
    ...shared,
    { key: "javascript_typescript", label: "JavaScript / TypeScript", modules: ["/features/oa-arena"] },
    { key: "react", label: "Frontend frameworks", modules: ["/features/oa-arena"] },
    { key: "api_design", label: "API design", modules: ["/features/system-design"] },
    { key: "databases", label: "Databases", modules: ["/features/system-design"] },
    { key: "deployment", label: "Deployment fundamentals", modules: ["/features/project-defense"] },
  ] },
  { id: "data", label: "Data engineering", match: ["data engineer", "analytics engineer", "data platform"], skills: [
    ...shared,
    { key: "sql", label: "SQL", modules: ["/features/oa-arena"] },
    { key: "data_modeling", label: "Data modelling", modules: ["/features/system-design"] },
    { key: "python", label: "Python", modules: ["/features/oa-arena"] },
    { key: "distributed_systems", label: "Distributed data systems", modules: ["/features/system-design"] },
  ] },
  { id: "devops", label: "DevOps / platform engineering", match: ["devops", "platform engineer", "site reliability", "sre", "cloud engineer"], skills: [
    ...shared,
    { key: "linux", label: "Linux fundamentals", modules: ["/features/oa-arena"] },
    { key: "networking", label: "Networking", modules: ["/features/system-design"] },
    { key: "cloud", label: "Cloud infrastructure", modules: ["/features/system-design"] },
    { key: "ci_cd", label: "CI / CD and automation", modules: ["/features/project-defense"] },
    { key: "observability", label: "Monitoring and observability", modules: ["/features/system-design"] },
  ] },
  { id: "mobile", label: "Mobile engineering", match: ["mobile", "ios developer", "android developer", "react native"], skills: [
    ...shared,
    { key: "mobile_platforms", label: "Mobile platform fundamentals", modules: ["/features/project-defense"] },
    { key: "javascript_typescript", label: "JavaScript / TypeScript", modules: ["/features/oa-arena"] },
    { key: "api_integration", label: "API integration", modules: ["/features/system-design"] },
    { key: "testing", label: "Testing fundamentals", modules: ["/features/project-defense"] },
  ] },
  { id: "general", label: "Software engineering", match: [], skills: [
    ...shared,
    { key: "programming_fundamentals", label: "Programming fundamentals", modules: ["/features/oa-arena"] },
    { key: "testing", label: "Testing fundamentals", modules: ["/features/project-defense"] },
    { key: "system_design", label: "System design", modules: ["/features/system-design"] },
    { key: "version_control", label: "Version control and collaboration", modules: ["/features/project-defense"] },
  ] },
];

function selectTemplate(role: string) {
  const normalized = role.toLowerCase();
  return templates.find((template) => template.match.some((term) => normalized.includes(term))) ?? templates[templates.length - 1];
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const rateLimitResponse = await enforceUserRateLimit(userId, "intelligence-role-coverage-read", 30, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const [goals, assessments] = await Promise.all([
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
    ]);

    const roleCoverage = goals.map((goal) => {
      const template = selectTemplate(goal.targetRole);
      const latest = new Map<string, { rating: number; assessedAt: Date }>();
      for (const assessment of assessments) {
        if (assessment.goalId !== null && assessment.goalId !== goal.id) continue;
        if (!latest.has(assessment.skillKey)) {
          latest.set(assessment.skillKey, { rating: assessment.rating, assessedAt: assessment.assessedAt });
        }
      }

      const skills = template.skills.map((skill) => {
        const assessment = latest.get(skill.key);
        return {
          ...skill,
          rating: assessment?.rating ?? null,
          assessedAt: assessment?.assessedAt.toISOString() ?? null,
          status: assessment ? "assessed" as const : "not_assessed" as const,
        };
      });
      const assessedCount = skills.filter((skill) => skill.status === "assessed").length;
      return {
        goal: { ...goal, targetDate: goal.targetDate?.toISOString() ?? null },
        template: { id: template.id, label: template.label },
        skills,
        totals: {
          requiredSkills: skills.length,
          assessedSkills: assessedCount,
          notYetAssessed: skills.length - assessedCount,
          assessmentCoveragePercent: Math.round((assessedCount / skills.length) * 100),
        },
      };
    });

    return NextResponse.json({
      goals: roleCoverage,
      methodology: {
        source: "Active career goals and the latest matching user-entered skill assessment for each skill.",
        coverage: "Coverage is the percentage of template skills with a recorded self-assessment. It is not a proficiency, employability, or hiring-readiness score.",
        mapping: "Role templates are transparent built-in starting points selected from role-title keywords. They are not employer-specific requirements and may not fit every job description.",
        scope: "Assessments linked to another goal are excluded. Unlinked assessments are treated as general profile assessments and can appear against each active goal.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Role coverage is unavailable. Check database configuration." }, { status: 503 });
  }
}

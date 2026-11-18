import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Skill = { key: string; label: string; href: string; aliases?: string[] };
const shared: Skill[] = [
  { key: "problem_solving", label: "Problem solving", href: "/features/oa-arena" },
  { key: "data_structures_algorithms", label: "Data structures and algorithms", href: "/features/oa-arena" },
  { key: "communication", label: "Technical communication", href: "/features/interview-lab" },
  { key: "core_cs", label: "Core computer science", href: "/features/interview-lab" },
];
const roleSkills: Array<{ match: string[]; skills: Skill[] }> = [
  { match: ["frontend", "front-end", "ui engineer", "web developer"], skills: [
    { key: "javascript_typescript", label: "JavaScript and TypeScript", href: "/features/oa-arena" },
    { key: "react", label: "React and component design", href: "/features/project-defense" },
    { key: "web_accessibility", label: "Web accessibility", href: "/features/project-defense" },
    { key: "web_performance", label: "Web performance", href: "/features/system-design" },
  ] },
  { match: ["backend", "back-end", "server engineer", "api developer"], skills: [
    { key: "api_design", label: "API design", href: "/features/system-design" },
    { key: "databases", label: "Databases and data modelling", href: "/features/system-design" },
    { key: "system_design", label: "System design", href: "/features/system-design" },
    { key: "security", label: "Application security", href: "/features/system-design" },
  ] },
  { match: ["full stack", "full-stack", "fullstack"], skills: [
    { key: "javascript_typescript", label: "JavaScript and TypeScript", href: "/features/oa-arena" },
    { key: "react", label: "Frontend frameworks", href: "/features/project-defense" },
    { key: "api_design", label: "API design", href: "/features/system-design" },
    { key: "databases", label: "Databases", href: "/features/system-design" },
    { key: "deployment", label: "Deployment fundamentals", href: "/features/project-defense" },
  ] },
  { match: ["data engineer", "analytics engineer", "data platform"], skills: [
    { key: "sql", label: "SQL", href: "/features/oa-arena" },
    { key: "data_modeling", label: "Data modelling", href: "/features/system-design" },
    { key: "python", label: "Python", href: "/features/oa-arena" },
    { key: "distributed_systems", label: "Distributed data systems", href: "/features/system-design" },
  ] },
  { match: ["devops", "platform engineer", "site reliability", "sre", "cloud engineer"], skills: [
    { key: "linux", label: "Linux fundamentals", href: "/features/oa-arena" },
    { key: "networking", label: "Networking", href: "/features/system-design" },
    { key: "cloud", label: "Cloud infrastructure", href: "/features/system-design" },
    { key: "ci_cd", label: "CI/CD and automation", href: "/features/project-defense" },
    { key: "observability", label: "Monitoring and observability", href: "/features/system-design" },
  ] },
  { match: ["mobile", "ios developer", "android developer", "react native"], skills: [
    { key: "mobile_platforms", label: "Mobile platform fundamentals", href: "/features/project-defense" },
    { key: "javascript_typescript", label: "JavaScript and TypeScript", href: "/features/oa-arena" },
    { key: "api_integration", label: "API integration", href: "/features/system-design" },
    { key: "testing", label: "Testing fundamentals", href: "/features/project-defense" },
  ] },
  { match: ["general"], skills: [
    { key: "programming_fundamentals", label: "Programming fundamentals", href: "/features/oa-arena" },
    { key: "testing", label: "Testing fundamentals", href: "/features/project-defense" },
    { key: "system_design", label: "System design", href: "/features/system-design" },
    { key: "version_control", label: "Version control and collaboration", href: "/features/project-defense" },
  ] },
];

function skillsForRole(role: string): Skill[] {
  const normalized = role.toLowerCase();
  const match = roleSkills.find(item => item.match.some(term => normalized.includes(term)));
  return [...shared, ...(match?.skills ?? roleSkills[roleSkills.length - 1].skills)];
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const [goals, assessments, roadmapTasks] = await Promise.all([
      prisma.careerGoal.findMany({
        where: { userId, status: "active" },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: { id: true, targetRole: true, targetCompany: true },
      }),
      prisma.skillAssessment.findMany({
        where: { userId, goalId: { not: null } },
        orderBy: [{ assessedAt: "desc" }, { id: "desc" }],
        take: 500,
        select: { goalId: true, skillKey: true, rating: true, assessedAt: true },
      }),
      prisma.careerRoadmapTask.findMany({
        where: { goal: { userId, status: "active" } },
        orderBy: { sortOrder: "asc" },
        take: 500,
        select: { id: true, goalId: true, skillKey: true, title: true, status: true, module: true },
      }),
    ]);

    const gaps = goals.flatMap(goal => {
      const latest = new Map<string, { rating: number; assessedAt: Date }>();
      for (const assessment of assessments) {
        if (assessment.goalId === goal.id && !latest.has(assessment.skillKey)) {
          latest.set(assessment.skillKey, { rating: assessment.rating, assessedAt: assessment.assessedAt });
        }
      }
      const required = skillsForRole(goal.targetRole);
      const goalTasks = roadmapTasks.filter(task => task.goalId === goal.id);
      return required.flatMap(skill => {
        const rating = latest.get(skill.key);
        const relatedTask = goalTasks.find(task => task.skillKey === skill.key && task.status !== "completed");
        if (rating && rating.rating >= 4) return [];
        const kind = !rating ? "unassessed" : "low_self_rating";
        const priority = !rating ? 65 : rating.rating === 1 ? 100 : rating.rating === 2 ? 92 : 82;
        return [{
          id: "skill-" + goal.id + "-" + skill.key,
          goalId: goal.id,
          goalRole: goal.targetRole,
          goalCompany: goal.targetCompany,
          skillKey: skill.key,
          skill: skill.label,
          rating: rating?.rating ?? null,
          assessedAt: rating?.assessedAt.toISOString() ?? null,
          kind,
          priority,
          title: (rating ? "Strengthen " : "Assess ") + skill.label,
          reason: rating
            ? "Your latest self-rating for " + skill.label + " is " + rating.rating + "/5. Treat this as a self-reported signal; practise with evidence and reassess when ready."
            : "No skill rating is recorded for " + skill.label + " on this goal. Record an honest baseline before deciding what to study next.",
          href: skill.href,
          suggestedTask: relatedTask ? { id: relatedTask.id, title: relatedTask.title, status: relatedTask.status, module: relatedTask.module } : null,
          basis: "gap_closure",
        }];
      });
    }).sort((a, b) => b.priority - a.priority).slice(0, 40);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      gaps,
      summary: {
        activeGoals: goals.length,
        totalGaps: gaps.length,
        unassessed: gaps.filter(item => item.kind === "unassessed").length,
        lowSelfRatings: gaps.filter(item => item.kind === "low_self_rating").length,
      },
      methodology: "Role skill templates are deterministic and broad. Gaps are skills with no goal-linked self-rating or a latest self-rating of 3/5 or below. Ratings of 4/5 or 5/5 are not prioritised by this rule. This is a planning aid, not a proficiency assessment or job-readiness verdict.",
      limits: "Uses up to 50 active goals, 500 goal-linked assessments and 500 roadmap tasks. Only exact skill-key matches are used; unlinked profile ratings are not assigned to goals.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Gap closure intelligence is unavailable. Check database configuration and migrations." }, { status: 503 });
  }
}

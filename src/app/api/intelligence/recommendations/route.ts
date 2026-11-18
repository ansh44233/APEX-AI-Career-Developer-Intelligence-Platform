import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const moduleCatalog = [
  { key: "interview", label: "Interview Lab", href: "/features/interview-lab", skills: ["communication", "interview", "behavioural", "behavioral", "speaking"] },
  { key: "coding", label: "OA Arena", href: "/features/oa-arena", skills: ["coding", "algorithm", "data structure", "problem solving", "programming"] },
  { key: "system_design", label: "System Design Studio", href: "/features/system-design", skills: ["system design", "architecture", "scalability", "design"] },
  { key: "resume", label: "Resume Intelligence", href: "/features/resume-intelligence", skills: ["resume", "cv", "experience", " ats"] },
  { key: "project_defense", label: "Project Defense", href: "/features/project-defense", skills: ["project", "repository", "technical explanation"] },
] as const;

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const [assessments, sessions] = await Promise.all([
      prisma.skillAssessment.findMany({
        where: { userId },
        orderBy: { assessedAt: "desc" },
        select: { skillKey: true, rating: true, assessedAt: true },
        take: 250,
      }),
      prisma.practiceSession.groupBy({
        by: ["module"],
        where: { userId },
        _count: { _all: true },
      }),
    ]);

    const latestBySkill = new Map<string, { rating: number; assessedAt: Date }>();
    for (const item of assessments) {
      if (!latestBySkill.has(item.skillKey)) {
        latestBySkill.set(item.skillKey, { rating: item.rating, assessedAt: item.assessedAt });
      }
    }

    const sessionCount = new Map(sessions.map((item) => [item.module, item._count._all]));
    const recommendations: Array<{
      id: string;
      title: string;
      reason: string;
      href: string;
      basis: "self_assessment" | "practice_coverage" | "getting_started";
      priority: number;
    }> = [];

    for (const [skillKey, assessment] of latestBySkill) {
      if (assessment.rating > 3) continue;
      const normalized = skillKey.toLowerCase().replaceAll("_", " ").replaceAll("-", " ");
      const match = moduleCatalog.find((item) =>
        item.skills.some((term) => normalized.includes(term.trim()) || term.includes(normalized)),
      );
      if (!match) continue;
      recommendations.push({
        id: "skill-" + skillKey,
        title: "Practise " + match.label,
        reason: "Your latest self-assessment for " + skillKey + " was " + assessment.rating + "/5. Revisit this area and reassess after practice.",
        href: match.href,
        basis: "self_assessment",
        priority: 100 - assessment.rating * 10,
      });
    }

    if (recommendations.length === 0) {
      const leastPractised = [...moduleCatalog]
        .map((item) => ({ item, count: sessionCount.get(item.key) ?? 0 }))
        .sort((a, b) => a.count - b.count)[0];
      recommendations.push({
        id: "coverage-" + leastPractised.item.key,
        title: "Explore " + leastPractised.item.label,
        reason: leastPractised.count === 0
          ? "You have no saved sessions in this module yet. Try a short session to establish a baseline."
          : "This is currently your least-practised module based on saved session counts.",
        href: leastPractised.item.href,
        basis: assessments.length === 0 && sessions.length === 0 ? "getting_started" : "practice_coverage",
        priority: 10,
      });
    }

    recommendations.sort((a, b) => b.priority - a.priority);
    return NextResponse.json({
      recommendations: recommendations.slice(0, 5),
      methodology: {
        source: "Latest user-entered skill assessments and saved practice-session counts.",
        limits: "Recommendations are deterministic rules, not AI-generated advice. Self-assessments are subjective; session counts do not measure proficiency. Unmapped skills are not scored or inferred.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Recommendations are unavailable. Check database configuration." },
      { status: 503 },
    );
  }
}

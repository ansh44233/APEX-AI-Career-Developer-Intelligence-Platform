import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const moduleCatalog = [
  { key: "interview", label: "Interview Lab", href: "/features/interview-lab", skills: ["communication", "interview", "behavioural", "behavioral", "speaking"] },
  { key: "coding", label: "OA Arena", href: "/features/oa-arena", skills: ["coding", "algorithm", "data structure", "problem solving", "programming"] },
  { key: "system_design", label: "System Design Studio", href: "/features/system-design", skills: ["system design", "architecture", "scalability", "design"] },
  { key: "resume", label: "Resume Intelligence", href: "/features/resume-intelligence", skills: ["resume", "cv", "experience", "ats"] },
  { key: "project_defense", label: "Project Defense", href: "/features/project-defense", skills: ["project", "repository", "technical explanation"] },
] as const;

const DAY = 24 * 60 * 60 * 1000;
const daysSince = (date: Date, now: Date) =>
  Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY));

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
      prisma.practiceSession.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        select: {
          module: true,
          title: true,
          status: true,
          startedAt: true,
          _count: { select: { attempts: true } },
        },
        take: 250,
      }),
    ]);

    const now = new Date();
    const latestBySkill = new Map<string, { rating: number; assessedAt: Date }>();
    for (const item of assessments) {
      if (!latestBySkill.has(item.skillKey)) {
        latestBySkill.set(item.skillKey, { rating: item.rating, assessedAt: item.assessedAt });
      }
    }

    const statsByModule = new Map<string, { total: number; recent: number; attempts: number; lastPractised: Date | null }>();
    for (const session of sessions) {
      const stats = statsByModule.get(session.module) ?? { total: 0, recent: 0, attempts: 0, lastPractised: null };
      stats.total += 1;
      stats.attempts += session._count.attempts;
      if (daysSince(session.startedAt, now) <= 21) stats.recent += 1;
      if (!stats.lastPractised || session.startedAt > stats.lastPractised) stats.lastPractised = session.startedAt;
      statsByModule.set(session.module, stats);
    }

    const recommendations: Array<{
      id: string;
      title: string;
      reason: string;
      href: string;
      basis: "self_assessment" | "practice_coverage" | "practice_recency" | "getting_started";
      priority: number;
    }> = [];

    for (const [skillKey, assessment] of latestBySkill) {
      if (assessment.rating > 3) continue;
      const normalized = skillKey.toLowerCase().replaceAll("_", " ").replaceAll("-", " ");
      const match = moduleCatalog.find((item) =>
        item.skills.some((term) => normalized.includes(term) || term.includes(normalized)),
      );
      if (!match) continue;
      const stats = statsByModule.get(match.key);
      const age = daysSince(assessment.assessedAt, now);
      recommendations.push({
        id: "skill-" + skillKey,
        title: "Practise " + match.label,
        reason: "Your latest self-assessment for " + skillKey + " was " + assessment.rating + "/5" +
          (age > 30 ? " and was recorded " + age + " days ago." : ".") +
          " Try a focused session, then update your self-rating when you have new evidence.",
        href: match.href,
        basis: "self_assessment",
        priority: 100 - assessment.rating * 10 + (age > 30 ? 5 : 0) + (stats?.recent ? 0 : 3),
      });
    }

    const leastRecent = [...moduleCatalog]
      .map((item) => ({ item, stats: statsByModule.get(item.key) }))
      .sort((a, b) => {
        if (!a.stats?.lastPractised && b.stats?.lastPractised) return -1;
        if (a.stats?.lastPractised && !b.stats?.lastPractised) return 1;
        return (a.stats?.lastPractised?.getTime() ?? 0) - (b.stats?.lastPractised?.getTime() ?? 0);
      })[0];

    if (leastRecent) {
      const stats = leastRecent.stats;
      const age = stats?.lastPractised ? daysSince(stats.lastPractised, now) : null;
      const alreadyRecommended = recommendations.some((item) => item.href === leastRecent.item.href);
      if (!alreadyRecommended && (age === null || age > 21)) {
        recommendations.push({
          id: "coverage-" + leastRecent.item.key,
          title: stats ? "Revisit " + leastRecent.item.label : "Try " + leastRecent.item.label,
          reason: !stats
            ? "You have no saved sessions in this module yet. A short session will establish an activity baseline."
            : "Your latest saved session in this module was " + age + " days ago. Revisit it to keep your practice balanced.",
          href: leastRecent.item.href,
          basis: stats ? "practice_recency" : assessments.length === 0 && sessions.length === 0 ? "getting_started" : "practice_coverage",
          priority: stats ? 35 : 20,
        });
      }
    }

    if (recommendations.length === 0) {
      const leastPractised = [...moduleCatalog]
        .map((item) => ({ item, count: statsByModule.get(item.key)?.total ?? 0 }))
        .sort((a, b) => a.count - b.count)[0];
      if (leastPractised) {
        recommendations.push({
          id: "coverage-" + leastPractised.item.key,
          title: "Explore " + leastPractised.item.label,
          reason: "This is currently your least-practised module based on saved session counts. Counts describe activity, not proficiency.",
          href: leastPractised.item.href,
          basis: assessments.length === 0 && sessions.length === 0 ? "getting_started" : "practice_coverage",
          priority: 10,
        });
      }
    }

    recommendations.sort((a, b) => b.priority - a.priority);
    const moduleActivity = moduleCatalog.map(({ key, label }) => {
      const stats = statsByModule.get(key);
      return {
        module: key,
        label,
        sessions: stats?.total ?? 0,
        attempts: stats?.attempts ?? 0,
        recentSessions: stats?.recent ?? 0,
        lastPractisedAt: stats?.lastPractised?.toISOString() ?? null,
        daysSinceLastPractice: stats?.lastPractised ? daysSince(stats.lastPractised, now) : null,
      };
    });

    return NextResponse.json({
      generatedAt: now.toISOString(),
      recommendations: recommendations.slice(0, 5),
      moduleActivity,
      methodology: {
        source: "Latest user-entered skill assessments and up to 250 most recent saved practice sessions.",
        rules: "A latest self-rating of 3/5 or below can suggest a related module. A module with no saved practice or no session in the last 21 days can be suggested for coverage or recency.",
        limits: "These are deterministic prompts, not AI-generated advice or ability estimates. Session and attempt counts measure activity only. No weakness is inferred from an unscored response, and older records beyond the retrieval limit are not included.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { error: "Recommendations are unavailable. Check database configuration." },
      { status: 503 },
    );
  }
}

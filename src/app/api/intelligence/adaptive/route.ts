import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY = 86400000;

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const rateLimitResponse = await enforceUserRateLimit(userId, "intelligence-adaptive-read", 30, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    const attempts = await prisma.practiceAttempt.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        prompt: true,
        score: true,
        createdAt: true,
        session: { select: { module: true } },
      },
    });

    const now = new Date();
    const groups = new Map<string, {
      module: string;
      prompt: string;
      dates: Date[];
      scores: Array<{ value: number; at: Date }>;
    }>();

    for (const attempt of attempts) {
      const prompt = attempt.prompt.trim();
      const key = attempt.session.module + "::" + prompt.toLocaleLowerCase();
      const group = groups.get(key) ?? { module: attempt.session.module, prompt, dates: [], scores: [] };
      group.dates.push(attempt.createdAt);
      if (attempt.score !== null) group.scores.push({ value: Number(attempt.score), at: attempt.createdAt });
      groups.set(key, group);
    }

    const topicSignals = [...groups.values()].map((group) => {
      const latestAt = group.dates.reduce((latest, date) => date > latest ? date : latest, group.dates[0]);
      const orderedScores = [...group.scores].sort((a, b) => a.at.getTime() - b.at.getTime());
      const previous = orderedScores.length >= 2 ? orderedScores[orderedScores.length - 2] : null;
      const latest = orderedScores.at(-1) ?? null;
      const scoreTrend = previous && latest
        ? latest.value > previous.value ? "up" : latest.value < previous.value ? "down" : "unchanged"
        : "insufficient_data";
      return {
        module: group.module,
        prompt: group.prompt,
        attempts: group.dates.length,
        lastPractisedAt: latestAt.toISOString(),
        daysSinceLastPractice: Math.max(0, Math.floor((now.getTime() - latestAt.getTime()) / DAY)),
        scoreTrend,
        previousRecordedScore: previous?.value ?? null,
        latestRecordedScore: latest?.value ?? null,
        recordedScoreCount: orderedScores.length,
      };
    });

    const recommendations = topicSignals
      .map((topic) => {
        if (topic.scoreTrend === "down") return {
          id: "review-" + topic.module + "-" + topic.prompt.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48),
          type: "review",
          title: "Review a prompt with a lower latest score",
          prompt: topic.prompt,
          module: topic.module,
          reason: "The latest explicitly recorded score is lower than the previous recorded score for this exact prompt. Review your approach and record another assessment.",
          basis: "recorded_score_change",
          priority: 100,
        };
        if (topic.daysSinceLastPractice >= 21) return {
          id: "revisit-" + topic.module + "-" + topic.prompt.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48),
          type: "revisit",
          title: "Revisit a prompt from your history",
          prompt: topic.prompt,
          module: topic.module,
          reason: "You last practised this exact prompt " + topic.daysSinceLastPractice + " days ago. A fresh attempt can help you check what you remember.",
          basis: "practice_recency",
          priority: 50,
        };
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    const trends = topicSignals
      .filter((topic) => topic.recordedScoreCount >= 2)
      .sort((a, b) => b.lastPractisedAt.localeCompare(a.lastPractisedAt))
      .slice(0, 12);

    return NextResponse.json({
      generatedAt: now.toISOString(),
      totals: {
        promptsTracked: topicSignals.length,
        promptsWithComparableScores: trends.length,
        promptsWithLowerLatestScore: topicSignals.filter((topic) => topic.scoreTrend === "down").length,
        promptsDueForRevisit: topicSignals.filter((topic) => topic.daysSinceLastPractice >= 21).length,
      },
      recommendations,
      scoreTrends: trends,
      methodology: {
        source: "Up to 500 most recent saved attempts owned by the signed-in user.",
        scoreComparison: "Only compares the two latest explicitly saved numeric scores for the exact same prompt. It does not assume a score scale or claim statistical significance.",
        recency: "A prompt is suggested for revisit after 21 days without a saved attempt.",
        limits: "No response text is analysed. A score change is a recorded signal, not proof of learning, ability, or causation. Unscored attempts do not create performance trends.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Adaptive learning signals are unavailable. Check database configuration." }, { status: 503 });
  }
}

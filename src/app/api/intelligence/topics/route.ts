import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function moduleLabel(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const attempts = await prisma.practiceAttempt.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        prompt: true,
        createdAt: true,
        score: true,
        session: { select: { module: true, title: true } },
      },
    });

    const now = new Date();
    const groups = new Map<string, {
      module: string;
      prompt: string;
      count: number;
      firstSeenAt: Date;
      lastSeenAt: Date;
      recordedScores: number[];
    }>();

    for (const attempt of attempts) {
      const prompt = attempt.prompt.trim();
      const key = attempt.session.module + "::" + prompt.toLocaleLowerCase();
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
        if (attempt.createdAt < existing.firstSeenAt) existing.firstSeenAt = attempt.createdAt;
        if (attempt.createdAt > existing.lastSeenAt) existing.lastSeenAt = attempt.createdAt;
        if (attempt.score !== null) existing.recordedScores.push(Number(attempt.score));
      } else {
        groups.set(key, {
          module: attempt.session.module,
          prompt,
          count: 1,
          firstSeenAt: attempt.createdAt,
          lastSeenAt: attempt.createdAt,
          recordedScores: attempt.score === null ? [] : [Number(attempt.score)],
        });
      }
    }

    const topics = [...groups.values()]
      .map((item) => ({
        module: item.module,
        moduleLabel: moduleLabel(item.module),
        prompt: item.prompt,
        attempts: item.count,
        firstSeenAt: item.firstSeenAt.toISOString(),
        lastSeenAt: item.lastSeenAt.toISOString(),
        daysSinceLastAttempt: Math.max(0, Math.floor((now.getTime() - item.lastSeenAt.getTime()) / 86400000)),
        averageRecordedScore: item.recordedScores.length
          ? Math.round(item.recordedScores.reduce((sum, score) => sum + score, 0) / item.recordedScores.length * 100) / 100
          : null,
        recordedScoreCount: item.recordedScores.length,
      }))
      .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));

    return NextResponse.json({
      generatedAt: now.toISOString(),
      totals: {
        attemptsAnalysed: attempts.length,
        distinctPromptTopics: topics.length,
        repeatedTopics: topics.filter((topic) => topic.attempts > 1).length,
        topicsWithRecordedScores: topics.filter((topic) => topic.recordedScoreCount > 0).length,
      },
      topics: topics.slice(0, 30),
      methodology: {
        source: "Up to 500 most recent saved practice attempts belonging to the signed-in user.",
        grouping: "A topic is the exact saved prompt grouped case-insensitively within its practice module. APEX does not guess semantic topic labels.",
        scoring: "Average scores appear only when a scoring workflow explicitly saved numeric scores.",
        limits: "Repeated attempts indicate revisiting a prompt, not improvement or weakness. Records older than the retrieval limit are excluded.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Topic intelligence is unavailable. Check database configuration." }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const QUESTION_META = [
  { id: "beh-1", round: "Behavioural", title: "Introduction and motivation" },
  { id: "beh-2", round: "Behavioural", title: "Ownership and challenge" },
  { id: "beh-3", round: "Behavioural", title: "Collaboration and feedback" },
  { id: "tech-1", round: "Technical", title: "Problem decomposition" },
  { id: "tech-2", round: "Technical", title: "Debugging and reliability" },
  { id: "tech-3", round: "Technical", title: "Trade-offs" },
  { id: "sys-1", round: "System Design", title: "Design a scalable service" },
  { id: "sys-2", round: "System Design", title: "Failure handling" },
  { id: "sys-3", round: "System Design", title: "Security and privacy" },
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const goalId = request.nextUrl.searchParams.get("goalId");
    if (goalId && !UUID.test(goalId)) {
      return NextResponse.json({ error: "Invalid career goal ID." }, { status: 400 });
    }
    if (goalId) {
      const goal = await prisma.careerGoal.findFirst({
        where: { id: goalId, userId },
        select: { id: true, targetRole: true, targetCompany: true },
      });
      if (!goal) return NextResponse.json({ error: "Career goal not found." }, { status: 404 });
    }

    const sessions = await prisma.practiceSession.findMany({
      where: {
        userId,
        module: "interview",
        title: { startsWith: "Mock interview · " },
        ...(goalId ? { goalId } : {}),
      },
      orderBy: { startedAt: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        status: true,
        startedAt: true,
        goalId: true,
        attempts: {
          orderBy: { createdAt: "desc" },
          take: 9,
          select: { prompt: true, responseText: true, createdAt: true },
        },
      },
    });

    const byQuestion = new Map<string, { ratings: number[]; lastPractised: Date; attempts: number }>();
    let totalAttempts = 0;
    for (const session of sessions) {
      for (const attempt of session.attempts) {
        const match = /^MOCK\|([a-z0-9-]+)\|/i.exec(attempt.prompt);
        if (!match) continue;
        const questionId = match[1].toLowerCase();
        if (!QUESTION_META.some((question) => question.id === questionId)) continue;
        totalAttempts += 1;
        const current = byQuestion.get(questionId) ?? { ratings: [], lastPractised: attempt.createdAt, attempts: 0 };
        current.attempts += 1;
        if (attempt.createdAt > current.lastPractised) current.lastPractised = attempt.createdAt;
        const ratingMatch = /Self-review rating \(1–5\):\s*([1-5])\/5/i.exec(attempt.responseText ?? "");
        if (ratingMatch) current.ratings.push(Number(ratingMatch[1]));
        byQuestion.set(questionId, current);
      }
    }

    const questions = QUESTION_META.map((question) => {
      const record = byQuestion.get(question.id);
      const averageRating = record?.ratings.length
        ? Math.round((record.ratings.reduce((sum, rating) => sum + rating, 0) / record.ratings.length) * 100) / 100
        : null;
      return {
        ...question,
        attempts: record?.attempts ?? 0,
        selfReviewedAttempts: record?.ratings.length ?? 0,
        averageSelfReview: averageRating,
        lastPractisedAt: record?.lastPractised.toISOString() ?? null,
      };
    });

    const answered = questions.filter((question) => question.attempts > 0);
    const needsReview = questions
      .filter((question) => question.averageSelfReview !== null && question.averageSelfReview <= 2)
      .sort((a, b) => (a.averageSelfReview ?? 0) - (b.averageSelfReview ?? 0));
    const nextUnanswered = questions.find((question) => question.attempts === 0) ?? null;
    const recommended = needsReview[0]
      ? { ...needsReview[0], reason: "Your own latest practice history includes a low average self-review rating. Revisit this prompt and compare your next answer." }
      : nextUnanswered
        ? { ...nextUnanswered, reason: "This prompt has no saved answer in the selected practice scope. Try it next to broaden your coverage." }
        : answered.length
          ? { ...[...answered].sort((a, b) => (a.lastPractisedAt ?? "").localeCompare(b.lastPractisedAt ?? ""))[0], reason: "All nine prompts have saved answers. Revisit the least recently practised prompt." }
          : null;

    const roundCoverage = ["Behavioural", "Technical", "System Design"].map((round) => ({
      round,
      answered: questions.filter((question) => question.round === round && question.attempts > 0).length,
      total: 3,
    }));

    return NextResponse.json({
      scope: goalId ? "career-goal" : "all-mock-interviews",
      sessionCount: sessions.length,
      totalAttempts,
      answeredPromptCount: answered.length,
      totalPrompts: QUESTION_META.length,
      selfReviewedAttemptCount: questions.reduce((sum, question) => sum + question.selfReviewedAttempts, 0),
      questions,
      roundCoverage,
      needsReview,
      recommended,
      methodology: {
        rating: "Only learner-entered ratings saved in mock-interview responses are included. Averages describe self-review, not objective performance.",
        coverage: "A prompt is covered when at least one matching APEX mock-interview answer is saved in the selected scope.",
        limits: "The analysis uses up to 100 recent mock-interview sessions and up to 9 attempts per session. It does not inspect answer content, infer skill, grade responses or predict hiring outcomes.",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Interview intelligence is unavailable. Check database configuration and apply migrations." }, { status: 503 });
  }
}

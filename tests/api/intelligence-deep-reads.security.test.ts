import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentUserId, enforceUserRateLimit,
  careerGoalFindMany, roadmapTaskFindMany, skillAssessmentFindMany,
  practiceSessionFindMany, practiceSessionCount, practiceAttemptFindMany,
  jobTimelineEventFindMany, jobTimelineEventCount, jobApplicationFindMany,
  recommendationActionFindMany, recommendationActionCount, jobPreparationTaskCount,
} = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  careerGoalFindMany: vi.fn(),
  roadmapTaskFindMany: vi.fn(),
  skillAssessmentFindMany: vi.fn(),
  practiceSessionFindMany: vi.fn(),
  practiceSessionCount: vi.fn(),
  practiceAttemptFindMany: vi.fn(),
  jobTimelineEventFindMany: vi.fn(),
  jobTimelineEventCount: vi.fn(),
  jobApplicationFindMany: vi.fn(),
  recommendationActionFindMany: vi.fn(),
  recommendationActionCount: vi.fn(),
  jobPreparationTaskCount: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    careerGoal: { findMany: careerGoalFindMany },
    careerRoadmapTask: { findMany: roadmapTaskFindMany, count: vi.fn() },
    skillAssessment: { findMany: skillAssessmentFindMany },
    practiceSession: { findMany: practiceSessionFindMany, count: practiceSessionCount },
    practiceAttempt: { findMany: practiceAttemptFindMany },
    jobTimelineEvent: { findMany: jobTimelineEventFindMany, count: jobTimelineEventCount },
    jobApplication: { findMany: jobApplicationFindMany },
    careerRecommendationAction: { findMany: recommendationActionFindMany, count: recommendationActionCount },
    jobPreparationTask: { count: jobPreparationTaskCount },
  },
}));

import { GET as learningPathGET } from "@/app/api/intelligence/learning-path/route";
import { GET as dailyPlanGET } from "@/app/api/intelligence/daily-plan/route";
import { GET as skillMasteryGET } from "@/app/api/intelligence/skill-mastery/route";
import { GET as outcomesGET } from "@/app/api/intelligence/outcomes/route";

const databaseMocks = [
  careerGoalFindMany, roadmapTaskFindMany, skillAssessmentFindMany,
  practiceSessionFindMany, practiceSessionCount, practiceAttemptFindMany,
  jobTimelineEventFindMany, jobTimelineEventCount, jobApplicationFindMany,
  recommendationActionFindMany, recommendationActionCount, jobPreparationTaskCount,
];

const cases = [
  { name: "learning path", bucket: "intelligence-learning-path-read", run: learningPathGET },
  { name: "daily career plan", bucket: "intelligence-daily-plan-read", run: dailyPlanGET },
  { name: "skill mastery", bucket: "intelligence-skill-mastery-read", run: skillMasteryGET },
  { name: "career outcomes", bucket: "intelligence-outcomes-read", run: outcomesGET },
];

describe("deep career intelligence read limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("career-user");
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));
  });

  it.each(cases)("blocks $name database work after the per-user limit", async ({ bucket, run }) => {
    const response = await run();

    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("career-user", bucket, 20, 60 * 60);
    for (const databaseMock of databaseMocks) expect(databaseMock).not.toHaveBeenCalled();
  });

  it.each(cases)("rejects unauthenticated $name reads before rate limiting", async ({ run }) => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await run();

    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    for (const databaseMock of databaseMocks) expect(databaseMock).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserId, enforceUserRateLimit, careerGoalFindMany, skillAssessmentFindMany, careerRoadmapTaskFindMany, practiceSessionFindMany } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  careerGoalFindMany: vi.fn(),
  skillAssessmentFindMany: vi.fn(),
  careerRoadmapTaskFindMany: vi.fn(),
  practiceSessionFindMany: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    careerGoal: { findMany: careerGoalFindMany },
    skillAssessment: { findMany: skillAssessmentFindMany },
    careerRoadmapTask: { findMany: careerRoadmapTaskFindMany },
    practiceSession: { findMany: practiceSessionFindMany },
  },
}));

import { GET as gapClosureGET } from "@/app/api/intelligence/gap-closure/route";
import { GET as roleCoverageGET } from "@/app/api/intelligence/role-coverage/route";
import { GET as recommendationsGET } from "@/app/api/intelligence/recommendations/route";

const databaseMocks = [careerGoalFindMany, skillAssessmentFindMany, careerRoadmapTaskFindMany, practiceSessionFindMany];
const cases = [
  { name: "gap closure", bucket: "intelligence-gap-closure-read", run: () => gapClosureGET() },
  { name: "role coverage", bucket: "intelligence-role-coverage-read", run: () => roleCoverageGET() },
  { name: "recommendations", bucket: "intelligence-recommendations-read", run: () => recommendationsGET() },
];

describe("core intelligence read limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("core-intelligence-user");
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));
  });

  it.each(cases)("blocks $name database work after the per-user limit", async ({ bucket, run }) => {
    const response = await run();
    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("core-intelligence-user", bucket, 30, 60 * 60);
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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getCurrentUserId,
  enforceUserRateLimit,
  careerGoalFindFirst,
  companyEvidenceClaimFindMany,
  careerRoadmapTaskFindMany,
  practiceSessionFindMany,
  practiceAttemptFindMany,
  jobApplicationGroupBy,
  jobApplicationFindMany,
  jobTimelineEventGroupBy,
  jobTimelineEventFindMany,
  jobTimelineEventCount,
  jobPreparationTaskGroupBy,
} = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  careerGoalFindFirst: vi.fn(),
  companyEvidenceClaimFindMany: vi.fn(),
  careerRoadmapTaskFindMany: vi.fn(),
  practiceSessionFindMany: vi.fn(),
  practiceAttemptFindMany: vi.fn(),
  jobApplicationGroupBy: vi.fn(),
  jobApplicationFindMany: vi.fn(),
  jobTimelineEventGroupBy: vi.fn(),
  jobTimelineEventFindMany: vi.fn(),
  jobTimelineEventCount: vi.fn(),
  jobPreparationTaskGroupBy: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    careerGoal: { findFirst: careerGoalFindFirst },
    companyEvidenceClaim: { findMany: companyEvidenceClaimFindMany },
    careerRoadmapTask: { findMany: careerRoadmapTaskFindMany },
    practiceSession: { findMany: practiceSessionFindMany },
    practiceAttempt: { findMany: practiceAttemptFindMany },
    jobApplication: { groupBy: jobApplicationGroupBy, findMany: jobApplicationFindMany },
    jobTimelineEvent: { groupBy: jobTimelineEventGroupBy, findMany: jobTimelineEventFindMany, count: jobTimelineEventCount },
    jobPreparationTask: { groupBy: jobPreparationTaskGroupBy },
  },
}));

import { GET as companyPrepGET } from "@/app/api/intelligence/company-prep/route";
import { GET as topicsGET } from "@/app/api/intelligence/topics/route";
import { GET as adaptiveGET } from "@/app/api/intelligence/adaptive/route";
import { GET as careerPipelineGET } from "@/app/api/intelligence/career-pipeline/route";
import { GET as interviewPrepGET } from "@/app/api/intelligence/interview-prep/route";

const databaseMocks = [
  careerGoalFindFirst,
  companyEvidenceClaimFindMany,
  careerRoadmapTaskFindMany,
  practiceSessionFindMany,
  practiceAttemptFindMany,
  jobApplicationGroupBy,
  jobApplicationFindMany,
  jobTimelineEventGroupBy,
  jobTimelineEventFindMany,
  jobTimelineEventCount,
  jobPreparationTaskGroupBy,
];

const cases = [
  {
    name: "company preparation",
    bucket: "intelligence-company-prep-read",
    run: () => companyPrepGET(new NextRequest("http://localhost/api/intelligence/company-prep?goalId=11111111-1111-4111-8111-111111111111")),
  },
  { name: "topic intelligence", bucket: "intelligence-topics-read", run: () => topicsGET() },
  { name: "adaptive learning", bucket: "intelligence-adaptive-read", run: () => adaptiveGET() },
  { name: "career pipeline", bucket: "intelligence-career-pipeline-read", run: () => careerPipelineGET() },
  { name: "interview preparation", bucket: "intelligence-interview-prep-read", run: () => interviewPrepGET(new NextRequest("http://localhost/api/intelligence/interview-prep")) },
];

describe("expensive intelligence read limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("intelligence-user");
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));
  });

  it.each(cases)("blocks $name database work after the per-user limit", async ({ bucket, run }) => {
    const response = await run();

    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("intelligence-user", bucket, 30, 60 * 60);
    for (const databaseMock of databaseMocks) {
      expect(databaseMock).not.toHaveBeenCalled();
    }
  });

  it.each(cases)("rejects unauthenticated $name reads before rate limiting", async ({ run }) => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await run();

    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    for (const databaseMock of databaseMocks) {
      expect(databaseMock).not.toHaveBeenCalled();
    }
  });
});

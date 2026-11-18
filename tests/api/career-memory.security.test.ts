import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentUserId,
  enforceUserRateLimit,
  goalFindMany,
  assessmentFindMany,
  sessionFindMany,
  jobFindMany,
  eventCount,
} = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  goalFindMany: vi.fn(),
  assessmentFindMany: vi.fn(),
  sessionFindMany: vi.fn(),
  jobFindMany: vi.fn(),
  eventCount: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    careerGoal: { findMany: goalFindMany },
    skillAssessment: { findMany: assessmentFindMany },
    practiceSession: { findMany: sessionFindMany },
    jobApplication: { findMany: jobFindMany },
    jobTimelineEvent: { count: eventCount },
  },
}));

import { GET } from "@/app/api/intelligence/career-memory/route";

describe("career memory read controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("career-memory-user");
    enforceUserRateLimit.mockResolvedValue(null);
    goalFindMany.mockResolvedValue([]);
    assessmentFindMany.mockResolvedValue([]);
    sessionFindMany.mockResolvedValue([]);
    jobFindMany.mockResolvedValue([]);
    eventCount.mockResolvedValue(0);
  });

  it("rejects unauthenticated reads before rate limiting or database access", async () => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    expect(goalFindMany).not.toHaveBeenCalled();
    expect(assessmentFindMany).not.toHaveBeenCalled();
  });

  it("stops expensive summary queries when the per-user limit is reached", async () => {
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));

    const response = await GET();

    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith(
      "career-memory-user",
      "career-memory-read",
      30,
      60 * 60,
    );
    expect(goalFindMany).not.toHaveBeenCalled();
    expect(assessmentFindMany).not.toHaveBeenCalled();
    expect(sessionFindMany).not.toHaveBeenCalled();
    expect(jobFindMany).not.toHaveBeenCalled();
    expect(eventCount).not.toHaveBeenCalled();
  });

  it("returns a private summary under the configured per-user limit", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(enforceUserRateLimit).toHaveBeenCalledWith(
      "career-memory-user",
      "career-memory-read",
      30,
      60 * 60,
    );
    expect(goalFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "career-memory-user" },
    }));
    expect(assessmentFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "career-memory-user" },
    }));
    expect(sessionFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "career-memory-user" },
    }));
    expect(jobFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "career-memory-user" },
    }));
    expect(body.methodology.privacy).toContain("practice answer text");
  });
});

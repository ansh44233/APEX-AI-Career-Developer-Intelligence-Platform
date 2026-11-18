import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentUserId,
  enforceUserRateLimit,
  sessionGroupBy,
  attemptAggregate,
  sessionFindMany,
  assessmentGroupBy,
} = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  sessionGroupBy: vi.fn(),
  attemptAggregate: vi.fn(),
  sessionFindMany: vi.fn(),
  assessmentGroupBy: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    practiceSession: { groupBy: sessionGroupBy, findMany: sessionFindMany },
    practiceAttempt: { aggregate: attemptAggregate },
    skillAssessment: { groupBy: assessmentGroupBy },
  },
}));

import { GET } from "@/app/api/intelligence/overview/route";

describe("intelligence overview read controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("overview-user");
    enforceUserRateLimit.mockResolvedValue(null);
    sessionGroupBy.mockResolvedValue([]);
    attemptAggregate.mockResolvedValue({ _count: { _all: 0 }, _avg: { score: null } });
    sessionFindMany.mockResolvedValue([]);
    assessmentGroupBy.mockResolvedValue([]);
  });

  it("rejects unauthenticated reads before rate limiting or database access", async () => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    expect(sessionGroupBy).not.toHaveBeenCalled();
    expect(attemptAggregate).not.toHaveBeenCalled();
  });

  it("stops all overview queries when the per-user limit is reached", async () => {
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));

    const response = await GET();

    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("overview-user", "intelligence-overview-read", 30, 3600);
    expect(sessionGroupBy).not.toHaveBeenCalled();
    expect(attemptAggregate).not.toHaveBeenCalled();
    expect(sessionFindMany).not.toHaveBeenCalled();
    expect(assessmentGroupBy).not.toHaveBeenCalled();
  });

  it("returns a private, user-scoped descriptive snapshot under the limit", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(enforceUserRateLimit).toHaveBeenCalledWith("overview-user", "intelligence-overview-read", 30, 3600);
    expect(sessionGroupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "overview-user" } }));
    expect(attemptAggregate).toHaveBeenCalledWith(expect.objectContaining({ where: { session: { userId: "overview-user" } } }));
    expect(sessionFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "overview-user" }) }));
    expect(assessmentGroupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "overview-user" } }));
    expect(body.methodology.readinessScore).toBeNull();
  });
});

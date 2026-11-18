import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getCurrentUserId,
  enforceUserRateLimit,
  practiceSessionFindFirst,
  practiceAttemptCreate,
  practiceAttemptFindFirst,
  careerRecommendationActionFindMany,
  transaction,
} = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  practiceSessionFindFirst: vi.fn(),
  practiceAttemptCreate: vi.fn(),
  practiceAttemptFindFirst: vi.fn(),
  careerRecommendationActionFindMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    practiceSession: { findFirst: practiceSessionFindFirst },
    practiceAttempt: { create: practiceAttemptCreate, findFirst: practiceAttemptFindFirst },
    careerRecommendationAction: { findMany: careerRecommendationActionFindMany },
    $transaction: transaction,
  },
}));

import { POST as createAttempt } from "@/app/api/practice/sessions/[id]/attempts/route";
import { GET as listRecommendationActions, POST as saveRecommendationAction } from "@/app/api/intelligence/recommendation-actions/route";
import { PATCH as completeRecommendationAction } from "@/app/api/intelligence/recommendation-actions/[id]/route";

const sessionId = "00000000-0000-4000-8000-000000000001";
const actionId = "00000000-0000-4000-8000-000000000002";

function request(url: string, body?: unknown) {
  return new NextRequest(url, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("practice and recommendation write rate limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("rate-limit-user");
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));
    practiceSessionFindFirst.mockResolvedValue({ id: sessionId, status: "in_progress" });
    practiceAttemptFindFirst.mockResolvedValue({ id: actionId, feedbackJson: null });
  });

  it("blocks practice attempt creation before writing the response", async () => {
    const response = await createAttempt(
      request(`http://localhost/api/practice/sessions/${sessionId}/attempts`, { prompt: "Explain the design." }),
      { params: Promise.resolve({ id: sessionId }) },
    );
    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("rate-limit-user", "practice-attempt-create", 30, 3600);
    expect(practiceAttemptCreate).not.toHaveBeenCalled();
  });

  it("blocks recommendation action listing before the database query", async () => {
    const response = await listRecommendationActions();
    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("rate-limit-user", "recommendation-actions-read", 30, 3600);
    expect(careerRecommendationActionFindMany).not.toHaveBeenCalled();
  });

  it("blocks recommendation action writes before reading or mutating recommendation state", async () => {
    const response = await saveRecommendationAction(request("http://localhost/api/intelligence/recommendation-actions", {
      sourceKey: "skill-typescript",
      title: "Practice TypeScript",
      reason: "Build stronger fundamentals.",
      href: "/features/oa-arena",
      basis: "APEX analysis",
      action: "accepted",
    }));
    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("rate-limit-user", "recommendation-action-write", 30, 3600);
  });

  it("blocks recommendation completion before opening a transaction", async () => {
    const response = await completeRecommendationAction(
      request(`http://localhost/api/intelligence/recommendation-actions/${actionId}`, { action: "complete" }) as NextRequest,
      { params: Promise.resolve({ id: actionId }) },
    );
    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("rate-limit-user", "recommendation-action-complete", 30, 3600);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated writes before invoking the limiter", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await saveRecommendationAction(request("http://localhost/api/intelligence/recommendation-actions", {}));
    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
  });
});

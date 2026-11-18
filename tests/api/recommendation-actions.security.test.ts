import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, enforceUserRateLimit, prismaMock, transactionMock } = vi.hoisted(() => {
  const transaction = {
    careerRecommendationAction: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    careerRoadmapTask: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  return {
    getCurrentUserId: vi.fn(),
    enforceUserRateLimit: vi.fn(),
    transactionMock: transaction,
    prismaMock: {
      careerRecommendationAction: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      careerGoal: { findFirst: vi.fn() },
      careerRoadmapTask: { findFirst: vi.fn() },
      jobApplication: { findFirst: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)),
    },
  };
});

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { GET as listActions, POST as createAction } from "@/app/api/intelligence/recommendation-actions/route";
import { PATCH as completeAction } from "@/app/api/intelligence/recommendation-actions/[id]/route";

const USER_ID = "user-owner-123";
const OTHER_USER_ID = "another-user-456";
const GOAL_ID = "11111111-1111-4111-8111-111111111111";
const ACTION_ID = "22222222-2222-4222-8222-222222222222";

function jsonRequest(url: string, method: string, body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("recommendation action API access controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(USER_ID);
    enforceUserRateLimit.mockResolvedValue(null);
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof transactionMock) => Promise<unknown>) => callback(transactionMock),
    );
  });

  it("rejects listing actions without an authenticated session", async () => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await listActions();

    expect(response.status).toBe(401);
    expect(prismaMock.careerRecommendationAction.findMany).not.toHaveBeenCalled();
  });

  it("scopes listed actions to the authenticated user", async () => {
    prismaMock.careerRecommendationAction.findMany.mockResolvedValue([]);

    const response = await listActions();

    expect(response.status).toBe(200);
    expect(prismaMock.careerRecommendationAction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID }, take: 100 }),
    );
  });

  it("rejects action creation without authentication", async () => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await createAction(jsonRequest("http://localhost/api/intelligence/recommendation-actions", "POST", {}));

    expect(response.status).toBe(401);
    expect(prismaMock.careerRecommendationAction.create).not.toHaveBeenCalled();
  });

  it("rejects external destinations before touching persistence", async () => {
    const response = await createAction(jsonRequest(
      "http://localhost/api/intelligence/recommendation-actions",
      "POST",
      {
        sourceKey: "skill-react",
        title: "Review React",
        reason: "A practice reminder",
        href: "https://example.com",
        basis: "test",
        action: "accepted",
      },
    ));

    expect(response.status).toBe(400);
    expect(prismaMock.careerRecommendationAction.create).not.toHaveBeenCalled();
  });

  it("does not allow linking an action to another user's career goal", async () => {
    prismaMock.careerGoal.findFirst.mockResolvedValue(null);

    const response = await createAction(jsonRequest(
      "http://localhost/api/intelligence/recommendation-actions",
      "POST",
      {
        sourceKey: "skill-react",
        title: "Review React",
        reason: "A practice reminder",
        href: "/features/interview-lab",
        basis: "test",
        action: "accepted",
        goalId: GOAL_ID,
      },
    ));

    expect(response.status).toBe(404);
    expect(prismaMock.careerGoal.findFirst).toHaveBeenCalledWith({
      where: { id: GOAL_ID, userId: USER_ID },
      select: { id: true },
    });
    expect(prismaMock.careerRecommendationAction.create).not.toHaveBeenCalled();
  });

  it("does not complete an action owned by another user", async () => {
    transactionMock.careerRecommendationAction.findFirst.mockResolvedValue(null);

    const response = await completeAction(
      jsonRequest("http://localhost/api/intelligence/recommendation-actions/" + ACTION_ID, "PATCH", { action: "complete" }),
      { params: Promise.resolve({ id: ACTION_ID }) },
    );

    expect(response.status).toBe(404);
    expect(transactionMock.careerRecommendationAction.findFirst).toHaveBeenCalledWith({
      where: { id: ACTION_ID, userId: USER_ID },
      select: { id: true, status: true, roadmapTaskId: true },
    });
    expect(transactionMock.careerRecommendationAction.update).not.toHaveBeenCalled();
  });

  it("rejects completion without authentication", async () => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await completeAction(
      jsonRequest("http://localhost/api/intelligence/recommendation-actions/" + ACTION_ID, "PATCH", { action: "complete" }),
      { params: Promise.resolve({ id: ACTION_ID }) },
    );

    expect(response.status).toBe(401);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

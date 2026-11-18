import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, careerGoal } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  careerGoal: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/prisma", () => ({ prisma: { careerGoal } }));

import { PATCH, DELETE } from "@/app/api/career-goals/[id]/route";

const OWNER_ID = "owner-user-id";
const OTHER_USER_ID = "another-user-id";
const GOAL_ID = "11111111-1111-4111-8111-111111111111";
const context = { params: Promise.resolve({ id: GOAL_ID }) };

function request(method: "PATCH" | "DELETE", body?: unknown) {
  return new NextRequest("http://localhost/api/career-goals/" + GOAL_ID, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("career goal ownership controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(OWNER_ID);
    careerGoal.findFirst.mockResolvedValue(null);
  });

  it("does not update a goal owned by another user", async () => {
    // The row exists, but the owner-scoped lookup must not expose it.
    careerGoal.findFirst.mockResolvedValue(null);
    const response = await PATCH(request("PATCH", { status: "active" }), context);
    expect(response.status).toBe(404);
    expect(careerGoal.findFirst).toHaveBeenCalledWith({
      where: { id: GOAL_ID, userId: OWNER_ID },
      select: { id: true },
    });
    expect(careerGoal.update).not.toHaveBeenCalled();
  });

  it("does not delete a goal owned by another user", async () => {
    careerGoal.findFirst.mockResolvedValue(null);
    const response = await DELETE(request("DELETE"), context);
    expect(response.status).toBe(404);
    expect(careerGoal.findFirst).toHaveBeenCalledWith({
      where: { id: GOAL_ID, userId: OWNER_ID },
      select: { id: true },
    });
    expect(careerGoal.delete).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated updates before querying goal data", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await PATCH(request("PATCH", { status: "active" }), context);
    expect(response.status).toBe(401);
    expect(careerGoal.findFirst).not.toHaveBeenCalled();
    expect(careerGoal.update).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated deletes before querying goal data", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await DELETE(request("DELETE"), context);
    expect(response.status).toBe(401);
    expect(careerGoal.findFirst).not.toHaveBeenCalled();
    expect(careerGoal.delete).not.toHaveBeenCalled();
  });
});

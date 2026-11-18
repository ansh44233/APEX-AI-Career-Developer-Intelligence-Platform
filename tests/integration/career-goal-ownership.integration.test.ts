import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

const { getCurrentUserId } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));

import { PATCH, DELETE } from "@/app/api/career-goals/[id]/route";
import { prisma } from "@/lib/prisma";

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const OWNER_ID = randomUUID();
const OTHER_USER_ID = randomUUID();
const emailSuffix = randomUUID();
let updateGoalId = "";
let deleteGoalId = "";

function request(method: "PATCH" | "DELETE", goalId: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/career-goals/${goalId}`, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe.skipIf(!databaseAvailable)("career goal ownership against PostgreSQL", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: OWNER_ID, name: "APEX integration owner", email: `apex-owner-${emailSuffix}@example.test` },
        { id: OTHER_USER_ID, name: "APEX integration other user", email: `apex-other-${emailSuffix}@example.test` },
      ],
    });

    const updateGoal = await prisma.careerGoal.create({
      data: { userId: OTHER_USER_ID, targetRole: "Backend Engineer" },
      select: { id: true },
    });
    const deleteGoal = await prisma.careerGoal.create({
      data: { userId: OTHER_USER_ID, targetRole: "Platform Engineer" },
      select: { id: true },
    });
    updateGoalId = updateGoal.id;
    deleteGoalId = deleteGoal.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [OWNER_ID, OTHER_USER_ID] } },
    });
  });

  it("does not update another user's row in the real database", async () => {
    getCurrentUserId.mockResolvedValue(OWNER_ID);
    const response = await PATCH(
      request("PATCH", updateGoalId, { targetRole: "Staff Engineer" }),
      { params: Promise.resolve({ id: updateGoalId }) },
    );

    expect(response.status).toBe(404);
    const persisted = await prisma.careerGoal.findUnique({
      where: { id: updateGoalId },
      select: { userId: true, targetRole: true },
    });
    expect(persisted).toEqual({
      userId: OTHER_USER_ID,
      targetRole: "Backend Engineer",
    });
  });

  it("does not delete another user's row in the real database", async () => {
    getCurrentUserId.mockResolvedValue(OWNER_ID);
    const response = await DELETE(
      request("DELETE", deleteGoalId),
      { params: Promise.resolve({ id: deleteGoalId }) },
    );

    expect(response.status).toBe(404);
    const persisted = await prisma.careerGoal.findUnique({
      where: { id: deleteGoalId },
      select: { userId: true, targetRole: true },
    });
    expect(persisted).toEqual({
      userId: OTHER_USER_ID,
      targetRole: "Platform Engineer",
    });
  });
});

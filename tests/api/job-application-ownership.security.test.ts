import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, prismaMock } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  prismaMock: {
    jobApplication: { findFirst: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    careerGoal: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { PATCH, DELETE } from "@/app/api/jobs/[id]/route";

const USER_ID = "user-owner-123";
const JOB_ID = "33333333-3333-4333-8333-333333333333";
const context = { params: Promise.resolve({ id: JOB_ID }) };

function request(method: "PATCH" | "DELETE", body?: unknown) {
  return new NextRequest("http://localhost/api/jobs/" + JOB_ID, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("job application ownership controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(USER_ID);
    prismaMock.jobApplication.findFirst.mockResolvedValue(null);
    prismaMock.jobApplication.deleteMany.mockResolvedValue({ count: 0 });
  });

  it("does not update a job application owned by another user", async () => {
    const response = await PATCH(request("PATCH", { status: "interview" }), context);
    expect(response.status).toBe(404);
    expect(prismaMock.jobApplication.findFirst).toHaveBeenCalledWith({
      where: { id: JOB_ID, userId: USER_ID },
      select: { id: true },
    });
    expect(prismaMock.jobApplication.update).not.toHaveBeenCalled();
  });

  it("does not delete a job application owned by another user", async () => {
    const response = await DELETE(request("DELETE"), context);
    expect(response.status).toBe(404);
    expect(prismaMock.jobApplication.deleteMany).toHaveBeenCalledWith({
      where: { id: JOB_ID, userId: USER_ID },
    });
  });

  it("rejects unauthenticated updates before accessing job data", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await PATCH(request("PATCH", { status: "applied" }), context);
    expect(response.status).toBe(401);
    expect(prismaMock.jobApplication.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.jobApplication.update).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated deletes before accessing job data", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await DELETE(request("DELETE"), context);
    expect(response.status).toBe(401);
    expect(prismaMock.jobApplication.deleteMany).not.toHaveBeenCalled();
  });
});

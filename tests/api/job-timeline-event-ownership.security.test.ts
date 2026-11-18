import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, prismaMock } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  prismaMock: { jobTimelineEvent: { findFirst: vi.fn(), update: vi.fn(), deleteMany: vi.fn() } },
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { PATCH, DELETE } from "@/app/api/job-events/[id]/route";

const USER_ID = "user-owner-123";
const EVENT_ID = "44444444-4444-4444-8444-444444444444";
const context = { params: Promise.resolve({ id: EVENT_ID }) };

function request(method: "PATCH" | "DELETE", body?: unknown) {
  return new NextRequest("http://localhost/api/job-events/" + EVENT_ID, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe("job timeline event ownership controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(USER_ID);
    prismaMock.jobTimelineEvent.findFirst.mockResolvedValue(null);
    prismaMock.jobTimelineEvent.deleteMany.mockResolvedValue({ count: 0 });
  });

  it("does not update an event owned by another user", async () => {
    const response = await PATCH(request("PATCH", { title: "Changed follow-up" }), context);
    expect(response.status).toBe(404);
    expect(prismaMock.jobTimelineEvent.findFirst).toHaveBeenCalledWith({
      where: { id: EVENT_ID, userId: USER_ID },
      select: { id: true },
    });
    expect(prismaMock.jobTimelineEvent.update).not.toHaveBeenCalled();
  });

  it("does not delete an event owned by another user", async () => {
    const response = await DELETE(request("DELETE"), context);
    expect(response.status).toBe(404);
    expect(prismaMock.jobTimelineEvent.deleteMany).toHaveBeenCalledWith({
      where: { id: EVENT_ID, userId: USER_ID },
    });
  });

  it("rejects unauthenticated updates before accessing event data", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await PATCH(request("PATCH", { title: "Changed follow-up" }), context);
    expect(response.status).toBe(401);
    expect(prismaMock.jobTimelineEvent.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.jobTimelineEvent.update).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated deletes before accessing event data", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await DELETE(request("DELETE"), context);
    expect(response.status).toBe(401);
    expect(prismaMock.jobTimelineEvent.deleteMany).not.toHaveBeenCalled();
  });
});

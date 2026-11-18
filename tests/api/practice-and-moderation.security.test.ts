import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, prismaMock } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  prismaMock: {
    practiceSession: { findFirst: vi.fn(), update: vi.fn() },
    practiceAttempt: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    interviewExperienceReport: { findMany: vi.fn(), groupBy: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { GET as getAttempts, POST as createAttempt, PATCH as evaluateAttempt } from "@/app/api/practice/sessions/[id]/attempts/route";
import { PATCH as updateSession } from "@/app/api/practice/sessions/[id]/route";
import { GET as getModerationQueue } from "@/app/api/admin/interview-experiences/route";

const USER_ID = "user-owner-123";
const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const ATTEMPT_ID = "22222222-2222-4222-8222-222222222222";

function request(url: string, method = "GET", body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const context = { params: Promise.resolve({ id: SESSION_ID }) };

describe("practice attempt ownership controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(USER_ID);
  });

  it("does not update a practice session owned by someone else", async () => {
    prismaMock.practiceSession.findFirst.mockResolvedValue(null);
    const response = await updateSession(request("http://localhost/api/practice/sessions/" + SESSION_ID, "PATCH", {
      status: "completed",
    }), context);
    expect(response.status).toBe(404);
    expect(prismaMock.practiceSession.findFirst).toHaveBeenCalledWith({
      where: { id: SESSION_ID, userId: USER_ID },
      select: { id: true, status: true },
    });
    expect(prismaMock.practiceSession.update).not.toHaveBeenCalled();
  });

  it("does not list attempts from a session owned by someone else", async () => {
    prismaMock.practiceSession.findFirst.mockResolvedValue(null);
    const response = await getAttempts(request("http://localhost/api/practice/sessions/" + SESSION_ID + "/attempts"), context);
    expect(response.status).toBe(404);
    expect(prismaMock.practiceSession.findFirst).toHaveBeenCalledWith({
      where: { id: SESSION_ID, userId: USER_ID }, select: { id: true },
    });
    expect(prismaMock.practiceAttempt.findMany).not.toHaveBeenCalled();
  });

  it("does not create attempts in a session owned by someone else", async () => {
    prismaMock.practiceSession.findFirst.mockResolvedValue(null);
    const response = await createAttempt(request("http://localhost/api/practice/sessions/" + SESSION_ID + "/attempts", "POST", {
      prompt: "Explain a concept",
    }), context);
    expect(response.status).toBe(404);
    expect(prismaMock.practiceAttempt.create).not.toHaveBeenCalled();
  });

  it("does not evaluate an attempt that belongs to a different session", async () => {
    prismaMock.practiceSession.findFirst.mockResolvedValue({ id: SESSION_ID, status: "completed" });
    prismaMock.practiceAttempt.findFirst.mockResolvedValue(null);
    const response = await evaluateAttempt(request("http://localhost/api/practice/sessions/" + SESSION_ID + "/attempts", "PATCH", {
      attemptId: ATTEMPT_ID,
      rubric: [{ key: "reasoning", rating: 4 }],
    }), context);
    expect(response.status).toBe(404);
    expect(prismaMock.practiceAttempt.findFirst).toHaveBeenCalledWith({
      where: { id: ATTEMPT_ID, sessionId: SESSION_ID },
      select: { id: true, feedbackJson: true },
    });
    expect(prismaMock.practiceAttempt.update).not.toHaveBeenCalled();
  });

  it("does not evaluate attempts without authentication", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await evaluateAttempt(request("http://localhost/api/practice/sessions/" + SESSION_ID + "/attempts", "PATCH", {}), context);
    expect(response.status).toBe(401);
    expect(prismaMock.practiceSession.findFirst).not.toHaveBeenCalled();
  });
});

describe("moderator-only interview experience queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(USER_ID);
  });

  it("rejects unauthenticated queue access", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await getModerationQueue();
    expect(response.status).toBe(401);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.interviewExperienceReport.findMany).not.toHaveBeenCalled();
  });

  it("denies ordinary users access to the moderation queue", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "user" });
    const response = await getModerationQueue();
    expect(response.status).toBe(403);
    expect(prismaMock.interviewExperienceReport.findMany).not.toHaveBeenCalled();
  });

  it("allows moderators to load the pending queue", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: "moderator" });
    prismaMock.interviewExperienceReport.findMany.mockResolvedValue([]);
    prismaMock.interviewExperienceReport.groupBy.mockResolvedValue([]);
    const response = await getModerationQueue();
    expect(response.status).toBe(200);
    expect(prismaMock.interviewExperienceReport.findMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.interviewExperienceReport.groupBy).toHaveBeenCalled();
  });
});

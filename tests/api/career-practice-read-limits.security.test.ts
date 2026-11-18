import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, enforceUserRateLimit, prismaMock } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  prismaMock: {
    jobApplication: { findMany: vi.fn(), findFirst: vi.fn() },
    jobPreparationTask: { createMany: vi.fn(), findMany: vi.fn() },
    practiceSession: { findMany: vi.fn(), findFirst: vi.fn() },
    practiceAttempt: { findMany: vi.fn() },
    skillAssessment: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { GET as listJobs } from "@/app/api/jobs/route";
import { GET as getJobPreparation } from "@/app/api/jobs/[id]/preparation/route";
import { GET as listPracticeSessions } from "@/app/api/practice/sessions/route";
import { GET as listPracticeAttempts } from "@/app/api/practice/sessions/[id]/attempts/route";
import { GET as listSkillAssessments } from "@/app/api/skill-assessments/route";

const USER_ID = "career-read-user";
const JOB_ID = "33333333-3333-4333-8333-333333333333";
const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const context = { params: Promise.resolve({ id: JOB_ID }) };
const sessionContext = { params: Promise.resolve({ id: SESSION_ID }) };

function request(url: string) {
  return new NextRequest(url);
}

const databaseMocks = [
  prismaMock.jobApplication.findMany,
  prismaMock.jobApplication.findFirst,
  prismaMock.jobPreparationTask.createMany,
  prismaMock.jobPreparationTask.findMany,
  prismaMock.practiceSession.findMany,
  prismaMock.practiceSession.findFirst,
  prismaMock.practiceAttempt.findMany,
  prismaMock.skillAssessment.findMany,
];

const cases = [
  { name: "job listing", bucket: "job-list-read", limit: 30, run: () => listJobs() },
  { name: "job preparation", bucket: "job-preparation-read", limit: 20, run: () => getJobPreparation(request("http://localhost/api/jobs/" + JOB_ID + "/preparation"), context) },
  { name: "practice session listing", bucket: "practice-session-list-read", limit: 30, run: () => listPracticeSessions(request("http://localhost/api/practice/sessions")) },
  { name: "practice attempt listing", bucket: "practice-attempt-list-read", limit: 30, run: () => listPracticeAttempts(request("http://localhost/api/practice/sessions/" + SESSION_ID + "/attempts"), sessionContext) },
  { name: "skill assessment listing", bucket: "skill-assessment-list-read", limit: 30, run: () => listSkillAssessments() },
];

describe("career and practice read rate limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(USER_ID);
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));
  });

  it.each(cases)("blocks $name database work after the per-user limit", async ({ bucket, limit, run }) => {
    const response = await run();
    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith(USER_ID, bucket, limit, 60 * 60);
    for (const databaseMock of databaseMocks) expect(databaseMock).not.toHaveBeenCalled();
  });

  it.each(cases)("rejects unauthenticated $name reads before rate limiting", async ({ run }) => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await run();
    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    for (const databaseMock of databaseMocks) expect(databaseMock).not.toHaveBeenCalled();
  });
});

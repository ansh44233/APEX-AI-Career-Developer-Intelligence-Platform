import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, enforceUserRateLimit, practiceSessionCreate, jobApplicationCreate, skillAssessmentCreate, jobEventCreate, jobFindFirst } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(), enforceUserRateLimit: vi.fn(),
  practiceSessionCreate: vi.fn(), jobApplicationCreate: vi.fn(), skillAssessmentCreate: vi.fn(),
  jobEventCreate: vi.fn(), jobFindFirst: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    practiceSession: { create: practiceSessionCreate },
    jobApplication: { create: jobApplicationCreate, findFirst: jobFindFirst },
    skillAssessment: { create: skillAssessmentCreate },
    jobTimelineEvent: { create: jobEventCreate },
  },
}));

import { POST as createPracticeSession } from "@/app/api/practice/sessions/route";
import { POST as createJob } from "@/app/api/jobs/route";
import { POST as createAssessment } from "@/app/api/skill-assessments/route";
import { POST as createJobEvent } from "@/app/api/job-events/route";

const blocked = () => new Response(JSON.stringify({ error: "Rate limit reached." }), {
  status: 429, headers: { "content-type": "application/json" },
});
const requests = [
  { name: "practice session", bucket: "practice-session-create", run: () => createPracticeSession(new NextRequest("http://localhost/api/practice/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ module: "interview", title: "Practice session" }) })), create: practiceSessionCreate },
  { name: "job application", bucket: "job-application-create", run: () => createJob(new NextRequest("http://localhost/api/jobs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ company: "Example", role: "Engineer", jobDescription: "A sufficiently detailed job description for the role." }) })), create: jobApplicationCreate },
  { name: "skill assessment", bucket: "skill-assessment-create", run: () => createAssessment(new NextRequest("http://localhost/api/skill-assessments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ skillKey: "typescript", rating: 3 }) })), create: skillAssessmentCreate },
  { name: "job timeline event", bucket: "job-event-create", run: () => createJobEvent(new NextRequest("http://localhost/api/job-events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId: "00000000-0000-4000-8000-000000000001", eventType: "follow_up", title: "Recruiter follow-up", scheduledAt: "2026-12-01T10:00:00Z" }) })), create: jobEventCreate },
];

describe("core write rate limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("write-limit-user");
    enforceUserRateLimit.mockResolvedValue(blocked());
    jobFindFirst.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000001" });
  });

  it.each(requests)("blocks $name creation after its per-user limit", async ({ run, bucket, create }) => {
    const response = await run();
    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("write-limit-user", bucket, bucket === "job-event-create" ? 30 : 20, 60 * 60);
    expect(create).not.toHaveBeenCalled();
  });

  it.each(requests)("rejects unauthenticated $name creation before rate limiting", async ({ run }) => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await run();
    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
  });
});

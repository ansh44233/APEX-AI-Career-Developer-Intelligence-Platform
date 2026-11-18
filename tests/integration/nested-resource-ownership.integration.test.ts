import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

const { getCurrentUserId } = vi.hoisted(() => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));

import { PATCH as patchAttempt } from "@/app/api/practice/sessions/[id]/attempts/route";
import { PATCH as patchRoadmapTask } from "@/app/api/intelligence/roadmap/[id]/route";
import { PATCH as patchJobPreparation } from "@/app/api/jobs/[id]/preparation/route";
import { prisma } from "@/lib/prisma";

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const ownerId = randomUUID();
const recordOwnerId = randomUUID();
const suffix = randomUUID();
let sessionId = "";
let attemptId = "";
let roadmapTaskId = "";
let jobId = "";
let jobTaskId = "";

function request(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe.skipIf(!databaseAvailable)("nested resource ownership against PostgreSQL", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: ownerId, name: "APEX integration caller", email: `apex-caller-${suffix}@example.test` },
        { id: recordOwnerId, name: "APEX nested record owner", email: `apex-nested-owner-${suffix}@example.test` },
      ],
    });

    const goal = await prisma.careerGoal.create({
      data: { userId: recordOwnerId, targetRole: "Backend Engineer" },
      select: { id: true },
    });
    const roadmapTask = await prisma.careerRoadmapTask.create({
      data: {
        goalId: goal.id,
        taskKey: `ownership-${suffix}`,
        title: "Original roadmap task",
        description: "Integration fixture for nested ownership.",
        skillKey: "backend",
        module: "interview",
        phase: "foundation",
        sortOrder: 1,
      },
      select: { id: true },
    });
    roadmapTaskId = roadmapTask.id;

    const session = await prisma.practiceSession.create({
      data: {
        userId: recordOwnerId,
        module: "interview",
        title: "Nested ownership practice session",
        status: "in_progress",
      },
      select: { id: true },
    });
    sessionId = session.id;
    const attempt = await prisma.practiceAttempt.create({
      data: { sessionId, prompt: "Original prompt", responseText: "Original response" },
      select: { id: true },
    });
    attemptId = attempt.id;

    const job = await prisma.jobApplication.create({
      data: {
        userId: recordOwnerId,
        company: "Example Systems",
        role: "Backend Engineer",
        jobDescription: "Backend engineering role requiring TypeScript, APIs and PostgreSQL.",
      },
      select: { id: true },
    });
    jobId = job.id;
    const jobTask = await prisma.jobPreparationTask.create({
      data: {
        jobId,
        skillKey: `typescript-${suffix}`,
        title: "Original job preparation task",
        description: "Integration fixture for nested ownership.",
        module: "interview",
        sortOrder: 1,
      },
      select: { id: true },
    });
    jobTaskId = jobTask.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, recordOwnerId] } } });
  });

  it("prevents updating an attempt through another user's practice session", async () => {
    getCurrentUserId.mockResolvedValue(ownerId);
    const response = await patchAttempt(
      request(`http://localhost/api/practice/sessions/${sessionId}/attempts`, {
        attemptId,
        rubric: [{ key: "clarity", rating: 1 }],
        strengths: "Unauthorized update",
      }),
      { params: Promise.resolve({ id: sessionId }) },
    );
    expect(response.status).toBe(404);
    const row = await prisma.practiceAttempt.findUnique({
      where: { id: attemptId },
      select: { responseText: true, score: true, feedbackJson: true },
    });
    expect(row).toEqual({ responseText: "Original response", score: null, feedbackJson: null });
  });

  it("prevents updating a roadmap task through another user's goal", async () => {
    getCurrentUserId.mockResolvedValue(ownerId);
    const response = await patchRoadmapTask(
      request(`http://localhost/api/intelligence/roadmap/${roadmapTaskId}`, { status: "completed" }),
      { params: Promise.resolve({ id: roadmapTaskId }) },
    );
    expect(response.status).toBe(404);
    const row = await prisma.careerRoadmapTask.findUnique({
      where: { id: roadmapTaskId },
      select: { status: true, title: true, goal: { select: { userId: true } } },
    });
    expect(row).toEqual({
      status: "todo",
      title: "Original roadmap task",
      goal: { userId: recordOwnerId },
    });
  });

  it("prevents updating a job preparation task through another user's job", async () => {
    getCurrentUserId.mockResolvedValue(ownerId);
    const response = await patchJobPreparation(
      request(`http://localhost/api/jobs/${jobId}/preparation`, {
        taskId: jobTaskId,
        status: "completed",
      }),
      { params: Promise.resolve({ id: jobId }) },
    );
    expect(response.status).toBe(404);
    const row = await prisma.jobPreparationTask.findUnique({
      where: { id: jobTaskId },
      select: { status: true, title: true, job: { select: { userId: true } } },
    });
    expect(row).toEqual({
      status: "todo",
      title: "Original job preparation task",
      job: { userId: recordOwnerId },
    });
  });
});

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

const { getCurrentUserId } = vi.hoisted(() => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));

import { PATCH as patchJob, DELETE as deleteJob } from "@/app/api/jobs/[id]/route";
import { PATCH as patchEvent, DELETE as deleteEvent } from "@/app/api/job-events/[id]/route";
import { PATCH as patchPracticeSession } from "@/app/api/practice/sessions/[id]/route";
import { prisma } from "@/lib/prisma";

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const ownerId = randomUUID();
const otherUserId = randomUUID();
const suffix = randomUUID();
let jobId = "";
let eventId = "";
let practiceSessionId = "";

function request(url: string, method: "PATCH" | "DELETE", body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

describe.skipIf(!databaseAvailable)("job and practice ownership against PostgreSQL", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: ownerId, name: "APEX integration owner", email: `apex-owner-${suffix}@example.test` },
        { id: otherUserId, name: "APEX integration record owner", email: `apex-record-owner-${suffix}@example.test` },
      ],
    });

    const job = await prisma.jobApplication.create({
      data: {
        userId: otherUserId,
        company: "Example Systems",
        role: "Backend Engineer",
        jobDescription: "A sufficiently detailed example job description for integration testing ownership boundaries.",
        notes: "Original job notes",
      },
      select: { id: true },
    });
    jobId = job.id;

    const event = await prisma.jobTimelineEvent.create({
      data: {
        userId: otherUserId,
        jobId,
        eventType: "follow_up",
        title: "Original recruiter follow-up",
        scheduledAt: new Date("2026-12-01T10:00:00.000Z"),
      },
      select: { id: true },
    });
    eventId = event.id;

    const session = await prisma.practiceSession.create({
      data: {
        userId: otherUserId,
        module: "interview",
        title: "Private practice session",
        status: "in_progress",
      },
      select: { id: true },
    });
    practiceSessionId = session.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherUserId] } } });
  });

  it("prevents cross-user job updates and preserves the stored row", async () => {
    getCurrentUserId.mockResolvedValue(ownerId);
    const response = await patchJob(
      request(`http://localhost/api/jobs/${jobId}`, "PATCH", { notes: "Unauthorized change" }),
      { params: Promise.resolve({ id: jobId }) },
    );
    expect(response.status).toBe(404);
    const row = await prisma.jobApplication.findUnique({
      where: { id: jobId },
      select: { userId: true, notes: true },
    });
    expect(row).toEqual({ userId: otherUserId, notes: "Original job notes" });
  });

  it("prevents cross-user job deletion and preserves the stored row", async () => {
    getCurrentUserId.mockResolvedValue(ownerId);
    const response = await deleteJob(
      request(`http://localhost/api/jobs/${jobId}`, "DELETE"),
      { params: Promise.resolve({ id: jobId }) },
    );
    expect(response.status).toBe(404);
    expect(await prisma.jobApplication.findUnique({ where: { id: jobId }, select: { userId: true } }))
      .toEqual({ userId: otherUserId });
  });

  it("prevents cross-user timeline event updates and preserves the stored row", async () => {
    getCurrentUserId.mockResolvedValue(ownerId);
    const response = await patchEvent(
      request(`http://localhost/api/job-events/${eventId}`, "PATCH", { title: "Unauthorized change" }),
      { params: Promise.resolve({ id: eventId }) },
    );
    expect(response.status).toBe(404);
    const row = await prisma.jobTimelineEvent.findUnique({
      where: { id: eventId },
      select: { userId: true, title: true },
    });
    expect(row).toEqual({ userId: otherUserId, title: "Original recruiter follow-up" });
  });

  it("prevents cross-user timeline event deletion and preserves the stored row", async () => {
    getCurrentUserId.mockResolvedValue(ownerId);
    const response = await deleteEvent(
      request(`http://localhost/api/job-events/${eventId}`, "DELETE"),
      { params: Promise.resolve({ id: eventId }) },
    );
    expect(response.status).toBe(404);
    expect(await prisma.jobTimelineEvent.findUnique({ where: { id: eventId }, select: { userId: true } }))
      .toEqual({ userId: otherUserId });
  });

  it("prevents cross-user practice session updates and preserves the stored row", async () => {
    getCurrentUserId.mockResolvedValue(ownerId);
    const response = await patchPracticeSession(
      request(`http://localhost/api/practice/sessions/${practiceSessionId}`, "PATCH", { status: "completed" }),
      { params: Promise.resolve({ id: practiceSessionId }) },
    );
    expect(response.status).toBe(404);
    const row = await prisma.practiceSession.findUnique({
      where: { id: practiceSessionId },
      select: { userId: true, status: true, completedAt: true },
    });
    expect(row).toEqual({ userId: otherUserId, status: "in_progress", completedAt: null });
  });
});

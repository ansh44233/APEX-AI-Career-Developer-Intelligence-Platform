import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

const { getCurrentUserId } = vi.hoisted(() => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));

import { GET as getCaptureQueue, PATCH as reviewCapture } from "@/app/api/admin/company-evidence/route";
import { GET as getClaimQueue, PATCH as reviewClaim } from "@/app/api/admin/company-evidence/claims/route";
import { GET as getInterviewQueue, PATCH as reviewInterview } from "@/app/api/admin/interview-experiences/route";
import { prisma } from "@/lib/prisma";

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const suffix = randomUUID();
const ordinaryUserId = randomUUID();
const moderatorId = randomUUID();
const submitterId = randomUUID();
let selfCaptureId = "";
let concurrentCaptureId = "";
let approvedCaptureId = "";
let selfClaimId = "";
let selfReportId = "";
let concurrentReportId = "";

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe.skipIf(!databaseAvailable)("moderator review invariants against PostgreSQL", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: ordinaryUserId, name: "APEX ordinary user", email: `apex-mod-user-${suffix}@example.test` },
        { id: moderatorId, name: "APEX moderator", email: `apex-mod-reviewer-${suffix}@example.test`, role: "moderator" },
        { id: submitterId, name: "APEX evidence submitter", email: `apex-mod-submitter-${suffix}@example.test` },
      ],
    });

    const captures = await prisma.companySourceCapture.createManyAndReturn({
      data: [
        {
          sourceId: `moderator-self-${suffix}`, company: "Example Systems", sourceTitle: "Self review fixture",
          sourceUrl: "https://example.com/self-review", retrievedAt: new Date(), httpStatus: 200,
          contentHash: `self-${suffix}`, pageTitle: "Self review fixture", description: "Integration test",
          excerpt: "A sufficiently long source excerpt for review.", status: "pending", submittedById: moderatorId,
        },
        {
          sourceId: `moderator-race-${suffix}`, company: "Example Systems", sourceTitle: "Concurrent review fixture",
          sourceUrl: "https://example.com/concurrent-review", retrievedAt: new Date(), httpStatus: 200,
          contentHash: `race-${suffix}`, pageTitle: "Concurrent review fixture", description: "Integration test",
          excerpt: "A sufficiently long source excerpt for concurrent review.", status: "pending", submittedById: submitterId,
        },
        {
          sourceId: `moderator-approved-${suffix}`, company: "Example Systems", sourceTitle: "Approved capture fixture",
          sourceUrl: "https://example.com/approved-capture", retrievedAt: new Date(), httpStatus: 200,
          contentHash: `approved-${suffix}`, pageTitle: "Approved capture fixture", description: "Integration test",
          excerpt: "The official documentation describes supported platform capabilities.", status: "approved", submittedById: submitterId,
          reviewedById: moderatorId, reviewedAt: new Date(),
        },
      ],
      select: { id: true, sourceId: true },
    });
    selfCaptureId = captures.find((capture) => capture.sourceId.startsWith("moderator-self-"))!.id;
    concurrentCaptureId = captures.find((capture) => capture.sourceId.startsWith("moderator-race-"))!.id;
    approvedCaptureId = captures.find((capture) => capture.sourceId.startsWith("moderator-approved-"))!.id;

    const claim = await prisma.companyEvidenceClaim.create({
      data: {
        captureId: approvedCaptureId, company: "Example Systems", role: "Backend Engineer",
        claimType: "employer_guidance", claimText: "Example claim for moderator self-review test",
        supportingExcerpt: "The official documentation describes supported platform capabilities.",
        createdById: moderatorId, status: "pending",
      },
      select: { id: true },
    });
    selfClaimId = claim.id;

    const reports = await prisma.interviewExperienceReport.createManyAndReturn({
      data: [
        {
          userId: moderatorId, company: "Example Systems", role: "Backend Engineer", experienceLevel: "Entry level / Graduate",
          roundType: "Technical", difficulty: "Medium", questionText: "Moderator-authored report fixture",
          contentHash: `self-report-${suffix}`, status: "pending",
        },
        {
          userId: submitterId, company: "Example Systems", role: "Backend Engineer", experienceLevel: "Entry level / Graduate",
          roundType: "Technical", difficulty: "Medium", questionText: "Concurrent report review fixture",
          contentHash: `race-report-${suffix}`, status: "pending",
        },
      ],
      select: { id: true, contentHash: true },
    });
    selfReportId = reports.find((report) => report.contentHash.startsWith("self-report-"))!.id;
    concurrentReportId = reports.find((report) => report.contentHash.startsWith("race-report-"))!.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [ordinaryUserId, moderatorId, submitterId] } } });
  });

  it("denies ordinary users access to all moderator review queues", async () => {
    getCurrentUserId.mockResolvedValue(ordinaryUserId);
    const [captures, claims, reports] = await Promise.all([
      getCaptureQueue(), getClaimQueue(), getInterviewQueue(),
    ]);
    expect([captures.status, claims.status, reports.status]).toEqual([403, 403, 403]);
  });

  it("prevents a moderator from reviewing their own source capture", async () => {
    getCurrentUserId.mockResolvedValue(moderatorId);
    const response = await reviewCapture(jsonRequest("http://localhost/api/admin/company-evidence", {
      captureId: selfCaptureId, decision: "approve",
    }));
    expect(response.status).toBe(403);
    expect(await prisma.companySourceCapture.findUnique({ where: { id: selfCaptureId }, select: { status: true, reviewedById: true } }))
      .toEqual({ status: "pending", reviewedById: null });
  });

  it("prevents a moderator from reviewing their own evidence claim", async () => {
    getCurrentUserId.mockResolvedValue(moderatorId);
    const response = await reviewClaim(jsonRequest("http://localhost/api/admin/company-evidence/claims", {
      claimId: selfClaimId, decision: "approve",
    }));
    expect(response.status).toBe(403);
    expect(await prisma.companyEvidenceClaim.findUnique({ where: { id: selfClaimId }, select: { status: true, reviewedById: true } }))
      .toEqual({ status: "pending", reviewedById: null });
  });

  it("prevents a moderator from reviewing their own interview report", async () => {
    getCurrentUserId.mockResolvedValue(moderatorId);
    const response = await reviewInterview(jsonRequest("http://localhost/api/admin/interview-experiences", {
      reportId: selfReportId, decision: "approve",
    }));
    expect(response.status).toBe(403);
    expect(await prisma.interviewExperienceReport.findUnique({ where: { id: selfReportId }, select: { status: true, reviewedByUserId: true } }))
      .toEqual({ status: "pending", reviewedByUserId: null });
  });

  it("allows only one concurrent moderator decision for a source capture", async () => {
    getCurrentUserId.mockResolvedValue(moderatorId);
    const [first, second] = await Promise.all([
      reviewCapture(jsonRequest("http://localhost/api/admin/company-evidence", { captureId: concurrentCaptureId, decision: "approve" })),
      reviewCapture(jsonRequest("http://localhost/api/admin/company-evidence", { captureId: concurrentCaptureId, decision: "reject" })),
    ]);
    expect([first.status, second.status].sort()).toEqual([200, 409]);
    const row = await prisma.companySourceCapture.findUnique({ where: { id: concurrentCaptureId }, select: { status: true, reviewedById: true } });
    expect(["approved", "rejected"]).toContain(row?.status);
    expect(row?.reviewedById).toBe(moderatorId);
  });

  it("allows only one concurrent moderator decision for an interview report", async () => {
    getCurrentUserId.mockResolvedValue(moderatorId);
    const [first, second] = await Promise.all([
      reviewInterview(jsonRequest("http://localhost/api/admin/interview-experiences", { reportId: concurrentReportId, decision: "approve" })),
      reviewInterview(jsonRequest("http://localhost/api/admin/interview-experiences", { reportId: concurrentReportId, decision: "reject" })),
    ]);
    expect([first.status, second.status].sort()).toEqual([200, 409]);
    const row = await prisma.interviewExperienceReport.findUnique({ where: { id: concurrentReportId }, select: { status: true, reviewedByUserId: true } });
    expect(["approved", "rejected"]).toContain(row?.status);
    expect(row?.reviewedByUserId).toBe(moderatorId);
  });
});

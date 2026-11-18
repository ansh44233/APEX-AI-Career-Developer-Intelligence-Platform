import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseReviewInterviewExperience } from "@/lib/validation/interview-experience-review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getModerator() {
  const userId = await getCurrentUserId();
  if (!userId) return { userId: null, allowed: false };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return { userId, allowed: user?.role === "moderator" || user?.role === "admin" };
}

export async function GET() {
  try {
    const moderator = await getModerator();
    if (!moderator.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!moderator.allowed) return NextResponse.json({ error: "Moderator access required." }, { status: 403 });

    const [reports, counts, fingerprintRows] = await Promise.all([
      prisma.interviewExperienceReport.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true, company: true, role: true, experienceLevel: true, roundType: true,
          difficulty: true, interviewDate: true, questionText: true, experienceNote: true,
          sourceUrl: true, createdAt: true, contentHash: true,
        },
      }),
      prisma.interviewExperienceReport.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.interviewExperienceReport.findMany({
        where: { status: { in: ["pending", "approved"] } },
        select: { contentHash: true },
        take: 5000,
      }),
    ]);
    const summary = { pending: 0, approved: 0, rejected: 0 };
    for (const item of counts) {
      if (item.status === "pending" || item.status === "approved" || item.status === "rejected") {
        summary[item.status] = item._count._all;
      }
    }
    const duplicateHashes = fingerprintRows.reduce((map, report) => {
      map.set(report.contentHash, (map.get(report.contentHash) ?? 0) + 1);
      return map;
    }, new Map<string, number>());
    return NextResponse.json({
      reports: reports.map(({ contentHash, ...report }) => ({
        ...report,
        possibleDuplicateInQueue: (duplicateHashes.get(contentHash) ?? 0) > 1,
      })),
      summary,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Moderation queue is unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const moderator = await getModerator();
    if (!moderator.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!moderator.allowed) return NextResponse.json({ error: "Moderator access required." }, { status: 403 });

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = parseReviewInterviewExperience(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review decision.", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.interviewExperienceReport.findUnique({
      where: { id: parsed.data.reportId },
      select: { id: true, userId: true, status: true },
    });
    if (!existing) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    if (existing.userId === moderator.userId) {
      return NextResponse.json({ error: "You cannot review your own submission." }, { status: 403 });
    }
    if (existing.status !== "pending") {
      return NextResponse.json({ error: "This report has already been reviewed." }, { status: 409 });
    }

    const result = await prisma.interviewExperienceReport.updateMany({
      where: { id: existing.id, status: "pending" },
      data: {
        status: parsed.data.decision === "approve" ? "approved" : "rejected",
        reviewNote: parsed.data.reviewNote || null,
        reviewedAt: new Date(),
        reviewedByUserId: moderator.userId,
      },
    });
    if (result.count !== 1) {
      return NextResponse.json({ error: "This report was reviewed by another moderator. Refresh the queue." }, { status: 409 });
    }
    return NextResponse.json({
      report: { id: existing.id, status: parsed.data.decision === "approve" ? "approved" : "rejected" },
    });
  } catch {
    return NextResponse.json({ error: "Could not save the moderation decision." }, { status: 503 });
  }
}

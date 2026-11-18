import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function moderatorAccess() {
  const userId = await getCurrentUserId();
  if (!userId) return { userId: null, allowed: false };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return { userId, allowed: user?.role === "moderator" || user?.role === "admin" };
}

export async function GET() {
  try {
    const access = await moderatorAccess();
    if (!access.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!access.allowed) return NextResponse.json({ error: "Moderator access required." }, { status: 403 });
    const [claims, captures] = await Promise.all([
      prisma.companyEvidenceClaim.findMany({
        where: { status: "pending" }, orderBy: { createdAt: "asc" }, take: 100,
        select: { id: true, captureId: true, company: true, role: true, claimType: true, claimText: true, supportingExcerpt: true, createdById: true, createdAt: true,
          capture: { select: { sourceTitle: true, sourceUrl: true, retrievedAt: true, contentHash: true } } },
      }),
      prisma.companySourceCapture.findMany({
        where: { status: "approved" }, orderBy: { retrievedAt: "desc" }, take: 100,
        select: { id: true, company: true, sourceTitle: true, sourceUrl: true, retrievedAt: true, excerpt: true, contentHash: true },
      }),
    ]);
    return NextResponse.json({ claims, captures }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Evidence claim workspace is unavailable." }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  try {
    const access = await moderatorAccess();
    if (!access.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!access.allowed) return NextResponse.json({ error: "Moderator access required." }, { status: 403 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (typeof body !== "object" || body === null) return NextResponse.json({ error: "Invalid claim." }, { status: 400 });
    const value = body as Record<string, unknown>;
    const captureId = typeof value.captureId === "string" ? value.captureId : "";
    const role = typeof value.role === "string" ? value.role.trim() : "";
    const claimText = typeof value.claimText === "string" ? value.claimText.trim() : "";
    const supportingExcerpt = typeof value.supportingExcerpt === "string" ? value.supportingExcerpt.trim() : "";
    const claimType = value.claimType;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(captureId) ||
        !role || role.length > 100 || !claimText || claimText.length > 500 ||
        supportingExcerpt.length < 12 || supportingExcerpt.length > 1200 ||
        (claimType !== "explicit_requirement" && claimType !== "employer_guidance")) {
      return NextResponse.json({ error: "Provide a valid capture, role, claim, evidence passage and claim type." }, { status: 400 });
    }
    const capture = await prisma.companySourceCapture.findFirst({
      where: { id: captureId, status: "approved" },
      select: { id: true, company: true, excerpt: true },
    });
    if (!capture) return NextResponse.json({ error: "Only approved source snapshots can support claims." }, { status: 404 });
    if (!capture.excerpt.includes(supportingExcerpt)) {
      return NextResponse.json({ error: "The supporting passage must exactly match text in the approved source snapshot." }, { status: 400 });
    }
    const claim = await prisma.companyEvidenceClaim.create({
      data: { captureId, company: capture.company, role, claimType, claimText, supportingExcerpt, createdById: access.userId, status: "pending" },
      select: { id: true, status: true },
    });
    return NextResponse.json({ claim }, { status: 201 });
  } catch { return NextResponse.json({ error: "Could not create evidence claim." }, { status: 503 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await moderatorAccess();
    if (!access.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!access.allowed) return NextResponse.json({ error: "Moderator access required." }, { status: 403 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (typeof body !== "object" || body === null) return NextResponse.json({ error: "Invalid review." }, { status: 400 });
    const value = body as Record<string, unknown>;
    const claimId = typeof value.claimId === "string" ? value.claimId : "";
    const decision = value.decision;
    const reviewNote = typeof value.reviewNote === "string" ? value.reviewNote.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(claimId) ||
        (decision !== "approve" && decision !== "reject") || reviewNote.length > 500) {
      return NextResponse.json({ error: "Invalid claim ID, decision or review note." }, { status: 400 });
    }
    const existing = await prisma.companyEvidenceClaim.findUnique({ where: { id: claimId }, select: { id: true, createdById: true, status: true } });
    if (!existing) return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    if (existing.createdById === access.userId) return NextResponse.json({ error: "You cannot review your own claim." }, { status: 403 });
    if (existing.status !== "pending") return NextResponse.json({ error: "Claim already reviewed." }, { status: 409 });
    const status = decision === "approve" ? "approved" : "rejected";
    const updated = await prisma.companyEvidenceClaim.updateMany({
      where: { id: claimId, status: "pending" },
      data: { status, reviewNote: reviewNote || null, reviewedById: access.userId, reviewedAt: new Date() },
    });
    if (updated.count !== 1) return NextResponse.json({ error: "Claim was reviewed concurrently. Refresh the queue." }, { status: 409 });
    return NextResponse.json({ claim: { id: claimId, status } });
  } catch { return NextResponse.json({ error: "Could not save claim review." }, { status: 503 }); }
}

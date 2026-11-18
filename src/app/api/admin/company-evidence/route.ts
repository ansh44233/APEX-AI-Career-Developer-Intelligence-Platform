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
    const [captures, counts] = await Promise.all([
      prisma.companySourceCapture.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true, sourceId: true, company: true, sourceTitle: true, sourceUrl: true,
          retrievedAt: true, httpStatus: true, contentHash: true, pageTitle: true,
          description: true, excerpt: true, submittedById: true, createdAt: true,
        },
      }),
      prisma.companySourceCapture.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);
    const summary = { pending: 0, approved: 0, rejected: 0 };
    for (const item of counts) {
      if (item.status === "pending" || item.status === "approved" || item.status === "rejected") summary[item.status] = item._count._all;
    }
    return NextResponse.json({ captures, summary }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Evidence review queue is unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await moderatorAccess();
    if (!access.userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!access.allowed) return NextResponse.json({ error: "Moderator access required." }, { status: 403 });
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (typeof body !== "object" || body === null || !("captureId" in body) || typeof body.captureId !== "string" ||
        !("decision" in body) || (body.decision !== "approve" && body.decision !== "reject") ||
        ("reviewNote" in body && body.reviewNote !== null && typeof body.reviewNote !== "string")) {
      return NextResponse.json({ error: "Provide a captureId, approve/reject decision and optional reviewNote." }, { status: 400 });
    }
    const { captureId, decision } = body as { captureId: string; decision: "approve" | "reject"; reviewNote?: string | null };
    const reviewNoteValue = "reviewNote" in body ? body.reviewNote : null;
    const reviewNote = typeof reviewNoteValue === "string" ? reviewNoteValue.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(captureId) || reviewNote.length > 500) {
      return NextResponse.json({ error: "Invalid capture ID or review note." }, { status: 400 });
    }
    const existing = await prisma.companySourceCapture.findUnique({ where: { id: captureId }, select: { id: true, submittedById: true, status: true } });
    if (!existing) return NextResponse.json({ error: "Capture not found." }, { status: 404 });
    if (existing.submittedById === access.userId) return NextResponse.json({ error: "You cannot review your own capture." }, { status: 403 });
    if (existing.status !== "pending") return NextResponse.json({ error: "This capture has already been reviewed." }, { status: 409 });
    const status = decision === "approve" ? "approved" : "rejected";
    const updated = await prisma.companySourceCapture.updateMany({
      where: { id: captureId, status: "pending" },
      data: { status, reviewNote: reviewNote || null, reviewedById: access.userId, reviewedAt: new Date() },
    });
    if (updated.count !== 1) return NextResponse.json({ error: "Another moderator already reviewed this capture. Refresh the queue." }, { status: 409 });
    return NextResponse.json({ capture: { id: captureId, status } });
  } catch {
    return NextResponse.json({ error: "Could not save evidence review decision." }, { status: 503 });
  }
}

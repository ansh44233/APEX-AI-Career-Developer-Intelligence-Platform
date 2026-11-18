import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseCreateCareerGoal } from "@/lib/validation/career-goal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json(
    { error: "Career goal storage is unavailable. Check database configuration." },
    { status: 503 },
  );
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const goals = await prisma.careerGoal.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        targetRole: true,
        targetCompany: true,
        targetDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { practiceSessions: true, skillAssessments: true } },
      },
    });

    return NextResponse.json(
      { goals },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return unavailable();
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const parsed = parseCreateCareerGoal(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid career goal.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const goal = await prisma.careerGoal.create({
      data: {
        userId,
        targetRole: parsed.data.targetRole,
        targetCompany: parsed.data.targetCompany || null,
        targetDate: parsed.data.targetDate
          ? new Date(parsed.data.targetDate + "T00:00:00.000Z")
          : null,
      },
      select: {
        id: true,
        targetRole: true,
        targetCompany: true,
        targetDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch {
    return unavailable();
  }
}

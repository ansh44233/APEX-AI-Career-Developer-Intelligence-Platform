import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseCreateInterviewExperience } from "@/lib/validation/interview-experience";
import { enforceUserRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const company = url.searchParams.get("company")?.trim().slice(0, 120);
  const role = url.searchParams.get("role")?.trim().slice(0, 120);
  const roundType = url.searchParams.get("round")?.trim().slice(0, 40);
  try {
    const reports = await prisma.interviewExperienceReport.findMany({
      where: {
        status: "approved",
        ...(company ? { company: { equals: company, mode: "insensitive" as const } } : {}),
        ...(role ? { role: { equals: role, mode: "insensitive" as const } } : {}),
        ...(roundType ? { roundType } : {}),
      },
      orderBy: [{ interviewDate: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true, company: true, role: true, experienceLevel: true, roundType: true,
        difficulty: true, interviewDate: true, questionText: true, experienceNote: true,
        sourceUrl: true, createdAt: true,
      },
    });
    return NextResponse.json({ reports }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Interview experience storage is unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const rateLimitResponse = await enforceUserRateLimit(userId, "interview-experience-submit", 5, 60 * 60);
    if (rateLimitResponse) return rateLimitResponse;

    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

    const parsed = parseCreateInterviewExperience(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid interview experience report.", details: parsed.error.flatten() }, { status: 400 });
    }

    const normalize = (value: string) => value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
    const contentHash = createHash("md5").update([
      normalize(parsed.data.company), normalize(parsed.data.role),
      normalize(parsed.data.roundType), normalize(parsed.data.questionText),
    ].join("|")).digest("hex");
    const duplicate = await prisma.interviewExperienceReport.findFirst({
      where: { contentHash },
      select: { id: true, status: true },
    });
    if (duplicate) {
      return NextResponse.json({
        error: "A matching report already exists, including previously reviewed submissions.",
        duplicateStatus: duplicate.status,
      }, { status: 409 });
    }

    const report = await prisma.interviewExperienceReport.create({
      data: {
        userId,
        company: parsed.data.company,
        role: parsed.data.role,
        experienceLevel: parsed.data.experienceLevel,
        roundType: parsed.data.roundType,
        difficulty: parsed.data.difficulty,
        interviewDate: parsed.data.interviewDate ? new Date(parsed.data.interviewDate + "T00:00:00.000Z") : null,
        questionText: parsed.data.questionText,
        experienceNote: parsed.data.experienceNote || null,
        sourceUrl: parsed.data.sourceUrl || null,
        contentHash,
        status: "pending",
      },
      select: { id: true, status: true, createdAt: true },
    });
    return NextResponse.json({ report, message: "Submitted for review. It will not appear publicly until approved." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Interview experience storage is unavailable." }, { status: 503 });
  }
}

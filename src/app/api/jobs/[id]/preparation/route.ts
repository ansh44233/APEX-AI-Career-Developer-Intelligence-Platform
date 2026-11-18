import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { detectJobSkills } from "@/lib/job-skill-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await context.params;
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
    const job = await prisma.jobApplication.findFirst({
      where: { id: parsedId.data, userId },
      select: { id: true, company: true, role: true, jobDescription: true, sourceUrl: true, goalId: true },
    });
    if (!job) return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
    const detected = detectJobSkills(job.jobDescription);
    if (detected.length) await prisma.jobPreparationTask.createMany({
      data: detected.map((skill, index) => ({
        jobId: job.id, skillKey: skill.key, title: "Prepare " + skill.label,
        description: skill.action, module: skill.module, sortOrder: index + 1,
      })), skipDuplicates: true,
    });
    const tasks = await prisma.jobPreparationTask.findMany({
      where: { jobId: job.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, skillKey: true, title: true, description: true, module: true, status: true, updatedAt: true },
    });
    return NextResponse.json({
      job: { id: job.id, company: job.company, role: job.role, sourceUrl: job.sourceUrl, goalId: job.goalId },
      tasks,
      methodology: "Tasks are seeded from exact phrase matches in the saved job description. They are preparation suggestions, not verified hiring criteria.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Job preparation data is unavailable. Check database configuration." }, { status: 503 }); }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const { id } = await context.params;
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
    const job = await prisma.jobApplication.findFirst({ where: { id: parsedId.data, userId }, select: { id: true } });
    if (!job) return NextResponse.json({ error: "Job listing not found." }, { status: 404 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const parsed = z.object({ taskId: z.string().uuid(), status: z.enum(["todo", "in_progress", "completed"]) }).strict().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid preparation task update.", details: parsed.error.flatten() }, { status: 400 });
    const result = await prisma.jobPreparationTask.updateMany({
      where: { id: parsed.data.taskId, jobId: job.id }, data: { status: parsed.data.status },
    });
    if (!result.count) return NextResponse.json({ error: "Preparation task not found." }, { status: 404 });
    const task = await prisma.jobPreparationTask.findFirst({
      where: { id: parsed.data.taskId, jobId: job.id },
      select: { id: true, skillKey: true, title: true, description: true, module: true, status: true, updatedAt: true },
    });
    return NextResponse.json({ task });
  } catch { return NextResponse.json({ error: "Job preparation data is unavailable. Check database configuration." }, { status: 503 }); }
}

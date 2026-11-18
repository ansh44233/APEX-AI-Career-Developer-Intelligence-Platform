import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { buildAgentMessages } from "@/lib/agent/prompt";
import { generateAgentReply } from "@/lib/agent/provider";
import { prisma } from "@/lib/prisma";
import { APEX_SKILLS, isApexSkillSlug } from "@/lib/skills/registry";
import { parseSendAgentMessage } from "@/lib/validation/agent-conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const parsed = parseSendAgentMessage(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid message.", details: parsed.error.flatten() }, { status: 400 });

  try {
    const conversation = await prisma.agentConversation.findFirst({
      where: { id, userId }, select: { id: true, skillSlug: true },
    });
    if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    if (!isApexSkillSlug(conversation.skillSlug)) return NextResponse.json({ error: "Conversation skill is no longer available." }, { status: 409 });

    const count = await prisma.agentMessage.count({ where: { conversationId: id } });
    if (count >= 100) return NextResponse.json({ error: "This conversation has reached its 100-message limit. Start a new conversation to continue." }, { status: 409 });

    const skill = APEX_SKILLS.find((item) => item.slug === conversation.skillSlug);
    if (!skill) return NextResponse.json({ error: "Skill not found." }, { status: 404 });
    const instructions = await readFile(path.join(process.cwd(), "skills", skill.slug, "SKILL.md"), "utf8");
    let accountContext: string | undefined;
    if (conversation.skillSlug === "career-copilot" && parsed.data.includeCareerContext) {
      const now = new Date();
      const [goals, jobs, assessments, sessions, events, approvedClaims] = await Promise.all([
        prisma.careerGoal.findMany({
          where: { userId, status: "active" }, orderBy: { updatedAt: "desc" }, take: 8,
          select: { id: true, targetRole: true, targetCompany: true, targetDate: true, status: true, roadmapTasks: { select: { status: true } } },
        }),
        prisma.jobApplication.findMany({
          where: { userId }, orderBy: { updatedAt: "desc" }, take: 12,
          select: {
            id: true, company: true, role: true, location: true, status: true, appliedAt: true, updatedAt: true,
            goal: { select: { targetRole: true, targetCompany: true } },
            preparationTasks: { orderBy: { sortOrder: "asc" }, take: 20, select: { skillKey: true, title: true, module: true, status: true } },
          },
        }),
        prisma.skillAssessment.findMany({
          where: { userId }, orderBy: { assessedAt: "desc" }, take: 60,
          select: { skillKey: true, rating: true, assessedAt: true, goal: { select: { id: true, targetRole: true, targetCompany: true } } },
        }),
        prisma.practiceSession.findMany({
          where: { userId }, orderBy: { startedAt: "desc" }, take: 15,
          select: { module: true, title: true, status: true, startedAt: true, goal: { select: { targetRole: true, targetCompany: true } }, _count: { select: { attempts: true } } },
        }),
        prisma.jobTimelineEvent.findMany({
          where: { userId, status: "pending" }, orderBy: { scheduledAt: "asc" }, take: 15,
          select: { id: true, eventType: true, title: true, scheduledAt: true, status: true, job: { select: { company: true, role: true, status: true } } },
        }),
        prisma.companyEvidenceClaim.findMany({
          where: { status: "approved", OR: goals.filter(goal => goal.targetCompany).map(goal => ({ company: { equals: goal.targetCompany!, mode: "insensitive" }, role: { equals: goal.targetRole, mode: "insensitive" } })) },
          orderBy: { reviewedAt: "desc" }, take: 12,
          select: { company: true, role: true, claimType: true, claimText: true, supportingExcerpt: true, capture: { select: { sourceTitle: true, sourceUrl: true, retrievedAt: true, contentHash: true } } },
        }),
      ]);
      const latestRatings = new Map<string, Array<{ rating: number; assessedAt: Date; goal: { id: string; targetRole: string; targetCompany: string | null } | null }>>();
      for (const item of assessments) {
        const key = `${item.skillKey}::${item.goal?.id ?? "profile"}`;
        const history = latestRatings.get(key) ?? [];
        if (history.length < 2) history.push({ rating: item.rating, assessedAt: item.assessedAt, goal: item.goal });
        latestRatings.set(key, history);
      }
      const skillMemory = [...latestRatings.entries()].map(([key, history]) => ({
        key, skill: key.split("::")[0], latestRating: history[0].rating,
        previousRating: history[1]?.rating ?? null,
        change: !history[1] ? "not_comparable" : history[0].rating > history[1].rating ? "higher_self_rating" : history[0].rating < history[1].rating ? "lower_self_rating" : "unchanged",
        assessedAt: history[0].assessedAt,
        goal: history[0].goal,
      }));
      const goalMemory = goals.map(goal => ({
        id: goal.id, role: goal.targetRole, company: goal.targetCompany, targetDate: goal.targetDate, status: goal.status,
        roadmap: { total: goal.roadmapTasks.length, completed: goal.roadmapTasks.filter(task => task.status === "completed").length, inProgress: goal.roadmapTasks.filter(task => task.status === "in_progress").length },
      }));
      const pipelineCounts = Object.fromEntries([...new Set(jobs.map(job => job.status))].map(status => [status, jobs.filter(job => job.status === status).length]));
      const practiceCounts = Object.fromEntries([...new Set(sessions.map(item => item.module))].map(module => [module, sessions.filter(item => item.module === module).length]));
      const overdueCount = events.filter(event => event.scheduledAt < now).length;
      const context = {
        generatedAt: now.toISOString(),
        note: "Snapshot is limited to recent saved records. Empty arrays mean no matching records were found in this snapshot. Derived memory is descriptive, not proof of skill or hiring readiness.",
        careerMemory: {
          activeGoalCount: goals.length,
          goals: goalMemory,
          skillSelfRatingHistory: skillMemory,
          applicationStageCounts: pipelineCounts,
          recentPracticeSessionsByModule: practiceCounts,
          pendingActionCounts: { total: events.length, overdue: overdueCount, upcoming: events.length - overdueCount },
          interpretation: "Skill rating changes compare the two most recent user-entered ratings for the same skill and goal context. Practice counts represent activity, not mastery. Roadmap completion is user-reported.",
        },
        activeGoals: goals.map(goal => ({ id: goal.id, role: goal.targetRole, company: goal.targetCompany, targetDate: goal.targetDate, status: goal.status })),
        jobApplications: jobs.map(job => ({
          id: job.id, company: job.company, role: job.role, location: job.location, status: job.status, appliedAt: job.appliedAt, lastUpdatedAt: job.updatedAt,
          linkedGoal: job.goal, preparation: job.preparationTasks.map(task => ({ skill: task.skillKey, task: task.title, module: task.module, status: task.status })),
        })),
        latestSelfAssessments: assessments.map(item => ({ skill: item.skillKey, ratingOutOf5: item.rating, recordedAt: item.assessedAt, goal: item.goal })),
        recentPracticeActivity: sessions.map(item => ({ module: item.module, session: item.title, status: item.status, startedAt: item.startedAt, attempts: item._count.attempts, goal: item.goal })),
        pendingTimelineEvents: events.map(item => ({ id: item.id, type: item.eventType, title: item.title, scheduledAt: item.scheduledAt, overdue: item.scheduledAt < now, linkedJob: item.job })),
        moderatorApprovedEmployerEvidence: approvedClaims.map(item => ({
          company: item.company, role: item.role, claimType: item.claimType, claim: item.claimText, supportingExcerpt: item.supportingExcerpt,
          sourceTitle: item.capture.sourceTitle, sourceUrl: item.capture.sourceUrl, capturedAt: item.capture.retrievedAt, snapshotHash: item.capture.contentHash,
        })),
      };
      accountContext = JSON.stringify(context);
    }
    const history = await prisma.agentMessage.findMany({
      where: { conversationId: id }, orderBy: { createdAt: "desc" }, take: 12,
      select: { role: true, content: true },
    });
    const orderedHistory = history.reverse() as Array<{ role: "user" | "assistant"; content: string }>;
    const userMessage = parsed.data.message;
    await prisma.agentMessage.create({ data: { conversationId: id, role: "user", content: userMessage } });
    await prisma.agentConversation.update({ where: { id }, data: { updatedAt: new Date() } });

    try {
      const reply = await generateAgentReply(buildAgentMessages(skill.name, instructions, [...orderedHistory, { role: "user", content: userMessage }], accountContext));
      const assistantMessage = await prisma.agentMessage.create({
        data: { conversationId: id, role: "assistant", content: reply },
        select: { id: true, role: true, content: true, createdAt: true },
      });
      await prisma.agentConversation.update({ where: { id }, data: { updatedAt: new Date() } });
      return NextResponse.json({ message: assistantMessage }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      const code = error instanceof Error ? error.message : "AI_PROVIDER_REQUEST_FAILED";
      if (code === "AI_PROVIDER_NOT_CONFIGURED") return NextResponse.json({ error: "AI provider is not configured. Your message was saved; configure the provider before retrying." }, { status: 503 });
      if (code === "AI_PROVIDER_CONFIGURATION_INVALID") return NextResponse.json({ error: "AI provider configuration is invalid." }, { status: 503 });
      return NextResponse.json({ error: "The AI provider could not complete this request. Your message was saved; you can send another message." }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Conversation storage or skill loading is unavailable." }, { status: 503 });
  }
}

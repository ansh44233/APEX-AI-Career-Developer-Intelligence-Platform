import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { buildAgentMessages } from "@/lib/agent/prompt";
import { generateAgentReply } from "@/lib/agent/provider";
import { APEX_SKILLS, isApexSkillSlug } from "@/lib/skills/registry";
import { parseAgentRequest } from "@/lib/validation/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = parseAgentRequest(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid agent request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { skill: slug, message } = parsed.data;
  if (!isApexSkillSlug(slug)) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  const skill = APEX_SKILLS.find((item) => item.slug === slug);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  let instructions: string;
  try {
    instructions = await readFile(path.join(process.cwd(), "skills", slug, "SKILL.md"), "utf8");
  } catch {
    return NextResponse.json({ error: "Selected skill is temporarily unavailable." }, { status: 503 });
  }

  try {
    const reply = await generateAgentReply(buildAgentMessages(skill.name, instructions, message));
    return NextResponse.json(
      { skill: { slug: skill.slug, name: skill.name }, reply },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "AI_PROVIDER_REQUEST_FAILED";
    if (code === "AI_PROVIDER_NOT_CONFIGURED") {
      return NextResponse.json({ error: "AI provider is not configured on this deployment." }, { status: 503 });
    }
    if (code === "AI_PROVIDER_CONFIGURATION_INVALID") {
      return NextResponse.json({ error: "AI provider configuration is invalid." }, { status: 503 });
    }
    return NextResponse.json({ error: "The AI provider could not complete this request. Please try again later." }, { status: 502 });
  }
}

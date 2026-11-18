import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { APEX_SKILLS, isApexSkillSlug } from "@/lib/skills/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  if (!isApexSkillSlug(slug)) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  const skill = APEX_SKILLS.find((item) => item.slug === slug);
  if (!skill) {
    return NextResponse.json({ error: "Skill not found." }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "skills", slug, "SKILL.md");
    const content = await readFile(filePath, "utf8");

    return NextResponse.json(
      {
        skill: {
          slug: skill.slug,
          name: skill.name,
          description: skill.description,
          version: skill.version,
          category: skill.category,
          capabilities: skill.capabilities,
        },
        format: "text/markdown",
        content,
        execution: {
          available: false,
          reason: "This endpoint distributes instructions only. It does not invoke an AI model or execute tools.",
        },
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Skill content is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

import { NextResponse } from "next/server";
import { APEX_SKILLS } from "@/lib/skills/registry";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      name: "APEX Skills Registry",
      version: "1.0.0",
      format: "agent-skills",
      specification: "https://agentskills.io/specification",
      count: APEX_SKILLS.length,
      skills: APEX_SKILLS.map(({ entrypoint, ...skill }) => skill),
      limitations: [
        "Registry discovery does not execute a skill.",
        "Agent compatibility and activation depend on the client.",
        "No repository access, model calls, or external actions are provided by this API.",
      ],
    },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}

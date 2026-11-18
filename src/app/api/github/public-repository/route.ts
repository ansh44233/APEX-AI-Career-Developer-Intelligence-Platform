import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { inspectPublicRepository, parsePublicRepository } from "@/lib/github/public-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const input = parsePublicRepository(body);
  if (!input) return NextResponse.json({ error: "Provide a valid GitHub owner and repository name." }, { status: 400 });
  try {
    const analysis = await inspectPublicRepository(input);
    return NextResponse.json({ analysis }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "REPOSITORY_NOT_FOUND") return NextResponse.json({ error: "Repository not found, or it is not publicly accessible." }, { status: 404 });
    if (code === "GITHUB_RATE_LIMITED") return NextResponse.json({ error: "GitHub API rate limit reached. Try again later." }, { status: 429 });
    if (code === "PUBLIC_REPOSITORIES_ONLY") return NextResponse.json({ error: "Only public repositories are supported in this version." }, { status: 403 });
    return NextResponse.json({ error: "GitHub could not provide repository information right now." }, { status: 502 });
  }
}

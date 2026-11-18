import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { analyzeSourceText } from "@/lib/github/code-quality";
import { proposePublicSourcePatch, reviewPublicSourceFile, reviewPublicSourceFiles, validatePublicSourcePatch } from "@/lib/github/ai-review";
import { inspectPublicArchitecture, inspectPublicRepository, inspectPublicTestIntelligence, listPublicSourceFiles, parsePublicRepository, readPublicSourceFile } from "@/lib/github/public-repository";

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
  const action = body && typeof body === "object" && "action" in body && typeof (body as { action?: unknown }).action === "string" ? (body as { action: string }).action : "inspect";
  try {
    if (action === "list-files") {
      const sourceFiles = await listPublicSourceFiles(input);
      return NextResponse.json({ sourceFiles }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "analyze-tests") {\n      const testIntelligence = await inspectPublicTestIntelligence(input);\n      return NextResponse.json({ testIntelligence }, { headers: { "Cache-Control": "no-store" } });\n    }\n    if (action === "analyze-architecture") {
      const architecture = await inspectPublicArchitecture(input);
      return NextResponse.json({ architecture }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "validate-patch") {
      const result = await validatePublicSourcePatch(input, (body as { path?: unknown }).path, (body as { unifiedDiff?: unknown }).unifiedDiff, (body as { sourceSha?: unknown }).sourceSha);
      return NextResponse.json({ result }, { status: result.status === "stale" ? 409 : 200, headers: { "Cache-Control": "no-store" } });
    }
    if (action === "propose-patch") {
      const result = await proposePublicSourcePatch(input, (body as { path?: unknown }).path, (body as { request?: unknown }).request);
      return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "ai-review-files") {
      const result = await reviewPublicSourceFiles(input, (body as { paths?: unknown }).paths);
      return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "ai-review-file") {
      const result = await reviewPublicSourceFile(input, (body as { path?: unknown }).path);
      return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "analyze-file") {
      const sourceFile = await readPublicSourceFile(input, (body as { path?: unknown }).path);
      const quality = analyzeSourceText(sourceFile.content);
      return NextResponse.json({ source: { path: sourceFile.path, url: sourceFile.url }, quality }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action === "read-file") {
      const sourceFile = await readPublicSourceFile(input, (body as { path?: unknown }).path);
      return NextResponse.json({ sourceFile }, { headers: { "Cache-Control": "no-store" } });
    }
    if (action !== "inspect") return NextResponse.json({ error: "Unsupported repository action." }, { status: 400 });
    const analysis = await inspectPublicRepository(input);
    return NextResponse.json({ analysis }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "REPOSITORY_NOT_FOUND") return NextResponse.json({ error: "Repository not found, or it is not publicly accessible." }, { status: 404 });
    if (code === "GITHUB_RATE_LIMITED") return NextResponse.json({ error: "GitHub API rate limit reached. Try again later." }, { status: 429 });
    if (code === "PUBLIC_REPOSITORIES_ONLY") return NextResponse.json({ error: "Only public repositories are supported in this version." }, { status: 403 });
    if (code === "INVALID_PATCH_VALIDATION_INPUT" || code === "INVALID_PATCH_DIFF") return NextResponse.json({ error: "The patch format is invalid or unsupported." }, { status: 400 });
    if (code === "PATCH_CONTEXT_MISMATCH") return NextResponse.json({ error: "Patch context does not match the current source file. The proposal cannot be validated." }, { status: 422 });
    if (code === "PATCH_PREVIEW_TOO_LARGE") return NextResponse.json({ error: "The proposed preview exceeds the supported size." }, { status: 413 });
    if (code === "INVALID_PATCH_REQUEST") return NextResponse.json({ error: "Describe the requested change in 8–2,000 characters." }, { status: 400 });
    if (code === "AI_PATCH_PROPOSAL_INVALID") return NextResponse.json({ error: "The AI provider returned an invalid patch proposal. Try again." }, { status: 502 });
    if (code === "INVALID_REVIEW_FILE_SET") return NextResponse.json({ error: "Select between 2 and 5 distinct eligible source files." }, { status: 400 });
    if (code === "INVALID_SOURCE_PATH" || code === "UNSUPPORTED_SOURCE_FILE") return NextResponse.json({ error: "That file path is not eligible for source preview." }, { status: 400 });
    if (code === "SOURCE_FILE_TOO_LARGE") return NextResponse.json({ error: "That file is too large or cannot be previewed as text." }, { status: 413 });
    if (code === "AI_PROVIDER_NOT_CONFIGURED" || code === "AI_PROVIDER_CONFIGURATION_INVALID") return NextResponse.json({ error: "AI review is unavailable until a valid server-side AI provider is configured." }, { status: 503 });
    if (code === "AI_REVIEW_OUTPUT_INVALID") return NextResponse.json({ error: "The AI provider returned an invalid review format. Try again." }, { status: 502 });
    if (code.startsWith("AI_PROVIDER_")) return NextResponse.json({ error: "The AI provider could not complete the review. Try again later." }, { status: 502 });
    return NextResponse.json({ error: "GitHub could not provide repository information right now." }, { status: 502 });
  }
}

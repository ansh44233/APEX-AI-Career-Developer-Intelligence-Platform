import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { enforceUserRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const languageIds: Record<string, number> = {
  Python: 71,
  JavaScript: 63,
  TypeScript: 74,
  Java: 62,
  C: 50,
  "C++": 54,
  "C#": 51,
  Go: 60,
  Rust: 73,
  PHP: 68,
  Ruby: 72,
  Kotlin: 78,
  Swift: 83,
  SQL: 82,
};

const outputLimit = 12000;

function bounded(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Sign in to run code." }, { status: 401 });

  const limited = await enforceUserRateLimit(userId, "question-bank-code-execution", 10, 60);
  if (limited) return limited;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const input = body as Record<string, unknown>;
  const language = typeof input.language === "string" ? input.language : "";
  const sourceCode = typeof input.code === "string" ? input.code : "";
  const stdin = typeof input.stdin === "string" ? input.stdin : "";

  if (!languageIds[language] || !sourceCode.trim() || sourceCode.length > 16000 || stdin.length > 4000) {
    return NextResponse.json({ error: "Choose a supported language and provide code (max 16,000 characters) and input (max 4,000 characters)." }, { status: 400 });
  }

  const endpoint = process.env.JUDGE0_API_URL?.trim().replace(/\/$/, "");
  const apiKey = process.env.JUDGE0_API_KEY?.trim();
  if (!endpoint) {
    return NextResponse.json({ error: "Code execution is not configured yet. AI review is available, but code has not been run." }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
    if (apiKey) headers["X-Auth-Token"] = apiKey;
    const response = await fetch(endpoint + "/submissions?base64_encoded=false&wait=true", {
      method: "POST",
      headers,
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({ source_code: sourceCode, language_id: languageIds[language], stdin, cpu_time_limit: 2, wall_time_limit: 5, memory_limit: 128000 })
    });
    if (!response.ok) {
      return NextResponse.json({ error: "The code execution service is unavailable. Try again later." }, { status: 502 });
    }
    const result = await response.json() as Record<string, unknown>;
    const status = result.status && typeof result.status === "object" ? result.status as Record<string, unknown> : {};
    const statusId = typeof status.id === "number" ? status.id : 0;
    const statusDescription = typeof status.description === "string" ? status.description : "Unknown";
    const stdout = bounded(result.stdout, outputLimit);
    const stderr = bounded(result.stderr, outputLimit);
    const compileOutput = bounded(result.compile_output, outputLimit);
    return NextResponse.json({
      status: statusDescription,
      statusId,
      stdout,
      stderr,
      compileOutput,
      time: typeof result.time === "string" ? result.time : null,
      memory: typeof result.memory === "number" ? result.memory : null,
      execution: statusId >= 1 && statusId <= 2 ? "queued" : statusId === 3 ? "completed" : "failed",
      message: statusDescription
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({ error: timedOut ? "Execution request timed out. Try again." : "Could not reach the code execution service." }, { status: timedOut ? 504 : 502 });
  } finally {
    clearTimeout(timeout);
  }
}

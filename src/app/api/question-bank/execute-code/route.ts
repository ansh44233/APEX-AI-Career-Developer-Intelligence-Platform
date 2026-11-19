import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
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
const requestTimeoutMs = 15000;
const pollIntervalMs = 750;
const maxPolls = 8;
const pollTokenLifetimeSeconds = 10 * 60;

function createPollToken(userId: string, submissionToken: string) {
  const payload = Buffer.from(JSON.stringify({ userId, submissionToken, expiresAt: Math.floor(Date.now() / 1000) + pollTokenLifetimeSeconds })).toString("base64url");
  const signature = createHmac("sha256", getServerEnv().BETTER_AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyPollToken(value: string, userId: string) {
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", getServerEnv().BETTER_AUTH_SECRET).update(payload).digest();
  let supplied: Buffer;
  try { supplied = Buffer.from(signature, "base64url"); } catch { return null; }
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: unknown; submissionToken?: unknown; expiresAt?: unknown };
    if (decoded.userId !== userId || typeof decoded.submissionToken !== "string" || !/^[a-zA-Z0-9-]{8,128}$/.test(decoded.submissionToken) || typeof decoded.expiresAt !== "number" || decoded.expiresAt < Math.floor(Date.now() / 1000)) return null;
    return decoded.submissionToken;
  } catch { return null; }
}

function bounded(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function parseResult(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getJudge0Config() {
  const rawEndpoint = process.env.JUDGE0_API_URL?.trim();
  const apiKey = process.env.JUDGE0_API_KEY?.trim();
  if (!rawEndpoint) return null;

  let endpoint: URL;
  try {
    endpoint = new URL(rawEndpoint);
  } catch {
    throw new Error("JUDGE0_API_URL must be a valid absolute URL.");
  }

  const localDevelopment = process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1"].includes(endpoint.hostname);
  if (endpoint.protocol !== "https:" && !localDevelopment) {
    throw new Error("Judge0 must use HTTPS outside local development.");
  }
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error("JUDGE0_API_URL must not contain credentials, query parameters, or a fragment.");
  }

  endpoint.pathname = `${endpoint.pathname.replace(/\/+$/, "")}/`;
  const isRapidApi = endpoint.hostname.endsWith(".rapidapi.com");
  if (isRapidApi && !apiKey) {
    throw new Error("JUDGE0_API_KEY is required for the RapidAPI Judge0 endpoint.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (isRapidApi) {
    headers["X-RapidAPI-Key"] = apiKey!;
    headers["X-RapidAPI-Host"] = endpoint.hostname;
  } else if (apiKey) {
    headers["X-Auth-Token"] = apiKey;
  }

  return { endpoint, headers };
}

async function readSubmission(response: Response) {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Judge0 returned an invalid response.");
  }
  const result = parseResult(payload);
  if (!result) throw new Error("Judge0 returned an invalid response.");
  return result;
}

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Sign in to retrieve this execution." }, { status: 401 });
  const limited = await enforceUserRateLimit(userId, "question-bank-code-poll", 30, 60);
  if (limited) return limited;

  const pollToken = request.nextUrl.searchParams.get("token") ?? "";
  if (pollToken.length > 2048) return NextResponse.json({ error: "Invalid execution token." }, { status: 400 });
  let submissionToken: string | null;
  try { submissionToken = verifyPollToken(pollToken, userId); } catch { submissionToken = null; }
  if (!submissionToken) return NextResponse.json({ error: "Execution token is invalid or expired." }, { status: 403 });

  let config: ReturnType<typeof getJudge0Config>;
  try { config = getJudge0Config(); } catch { config = null; }
  if (!config) return NextResponse.json({ error: "Code execution is not configured." }, { status: 503 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const pollUrl = new URL(`submissions/${encodeURIComponent(submissionToken)}?base64_encoded=false`, config.endpoint);
    const response = await fetch(pollUrl, { method: "GET", headers: config.headers, signal: controller.signal, cache: "no-store" });
    if (!response.ok) return NextResponse.json({ error: "Could not retrieve the execution result from Judge0." }, { status: 502 });
    const result = await readSubmission(response);
    const status = parseResult(result.status);
    const statusId = typeof status?.id === "number" ? status.id : 0;
    const statusDescription = typeof status?.description === "string" ? status.description : "Unknown";
    const queued = statusId === 1 || statusId === 2;
    return NextResponse.json({
      status: statusDescription, statusId,
      stdout: bounded(result.stdout, outputLimit), stderr: bounded(result.stderr, outputLimit),
      compileOutput: bounded(result.compile_output, outputLimit),
      time: typeof result.time === "string" ? result.time : null,
      memory: typeof result.memory === "number" ? result.memory : null,
      execution: queued ? "queued" : statusId === 3 ? "completed" : "failed",
      message: queued ? "Execution is still processing." : statusDescription,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({ error: timedOut ? "Execution status check timed out." : "Could not reach the code execution service." }, { status: timedOut ? 504 : 502 });
  } finally { clearTimeout(timeout); }
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Sign in to run code." }, { status: 401 });

  const limited = await enforceUserRateLimit(userId, "question-bank-code-execution", 10, 60);
  if (limited) return limited;

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 24000) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const language = typeof input.language === "string" ? input.language : "";
  const sourceCode = typeof input.code === "string" ? input.code : "";
  const stdin = typeof input.stdin === "string" ? input.stdin : "";

  if (!languageIds[language] || !sourceCode.trim() || sourceCode.length > 16000 || stdin.length > 4000) {
    return NextResponse.json({
      error: "Choose a supported language and provide code (max 16,000 characters) and input (max 4,000 characters).",
    }, { status: 400 });
  }

  let config: ReturnType<typeof getJudge0Config>;
  try {
    config = getJudge0Config();
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Judge0 configuration is invalid.",
    }, { status: 503 });
  }
  if (!config) {
    return NextResponse.json({
      error: "Code execution is not configured yet. AI review is available, but code has not been run.",
    }, { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const submitUrl = new URL("submissions?base64_encoded=false&wait=false", config.endpoint);
    const submitResponse = await fetch(submitUrl, {
      method: "POST",
      headers: config.headers,
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageIds[language],
        stdin,
        cpu_time_limit: 2,
        wall_time_limit: 5,
        memory_limit: 128000,
      }),
    });

    if (!submitResponse.ok) {
      return NextResponse.json({
        error: "The code execution service rejected the request or is unavailable. Check the Judge0 endpoint and credentials.",
      }, { status: 502 });
    }

    const submitted = await readSubmission(submitResponse);
    const token = typeof submitted.token === "string" ? submitted.token : "";
    if (!/^[a-zA-Z0-9-]{8,128}$/.test(token)) {
      return NextResponse.json({ error: "Judge0 did not return a valid submission token." }, { status: 502 });
    }

    let result: Record<string, unknown> = submitted;
    for (let attempt = 0; attempt < maxPolls; attempt += 1) {
      const status = parseResult(result.status);
      const statusId = typeof status?.id === "number" ? status.id : 0;
      if (statusId >= 3) break;

      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      const pollUrl = new URL(`submissions/${encodeURIComponent(token)}?base64_encoded=false`, config.endpoint);
      const pollResponse = await fetch(pollUrl, {
        method: "GET",
        headers: config.headers,
        signal: controller.signal,
        cache: "no-store",
      });
      if (!pollResponse.ok) {
        return NextResponse.json({ error: "Could not retrieve the execution result from Judge0." }, { status: 502 });
      }
      result = await readSubmission(pollResponse);
    }

    const status = parseResult(result.status);
    const statusId = typeof status?.id === "number" ? status.id : 0;
    const statusDescription = typeof status?.description === "string" ? status.description : "Unknown";
    const isQueued = statusId === 1 || statusId === 2;

    return NextResponse.json({
      status: statusDescription,
      statusId,
      stdout: bounded(result.stdout, outputLimit),
      stderr: bounded(result.stderr, outputLimit),
      compileOutput: bounded(result.compile_output, outputLimit),
      time: typeof result.time === "string" ? result.time : null,
      memory: typeof result.memory === "number" ? result.memory : null,
      execution: isQueued ? "queued" : statusId === 3 ? "completed" : "failed",
      message: isQueued ? "Your submission is still queued. APEX can continue checking this same submission." : statusDescription,
      ...(isQueued ? { pollToken: createPollToken(userId, token) } : {}),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return NextResponse.json({
      error: timedOut ? "Execution request timed out. Try again." : "Could not reach the code execution service.",
    }, { status: timedOut ? 504 : 502 });
  } finally {
    clearTimeout(timeout);
  }
}

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getCompanyEvidenceSourceById } from "@/lib/company-evidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 1_000_000;
const TIMEOUT_MS = 10_000;

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractText(html: string) {
  const title = decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).slice(0, 240);
  const description = decodeEntities((html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1] ?? "").trim()).slice(0, 500);
  const text = decodeEntities(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()).slice(0, 12_000);
  return { title, description, excerpt: text };
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "A JSON body is required." }, { status: 400 }); }
  const sourceId = typeof body === "object" && body !== null && "sourceId" in body && typeof body.sourceId === "string" ? body.sourceId : "";
  if (!sourceId || sourceId.length > 160) return NextResponse.json({ error: "Provide a valid sourceId." }, { status: 400 });

  const source = getCompanyEvidenceSourceById(sourceId);
  if (!source || source.authority !== "employer" || source.verification !== "official-destination-link") {
    return NextResponse.json({ error: "This source is not in the approved employer-source registry." }, { status: 400 });
  }

  let url: URL;
  try { url = new URL(source.url); } catch { return NextResponse.json({ error: "The registered source URL is invalid." }, { status: 500 }); }
  if (url.protocol !== "https:" || url.username || url.password) {
    return NextResponse.json({ error: "Only registered HTTPS sources can be inspected." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Accept": "text/html,application/xhtml+xml", "User-Agent": "APEX-ResearchPreview/1.0" },
    });
    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json({ error: "The source redirected. Redirects are not followed by this preview; open the official link directly." }, { status: 422 });
    }
    if (!response.ok) return NextResponse.json({ error: "The source returned HTTP " + response.status + "." }, { status: 422 });
    const type = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) {
      return NextResponse.json({ error: "Only HTML source pages can be previewed." }, { status: 415 });
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BYTES) return NextResponse.json({ error: "The source is larger than the 1 MB preview limit." }, { status: 413 });
    if (!response.body) return NextResponse.json({ error: "The source returned an empty response." }, { status: 422 });

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        return NextResponse.json({ error: "The source exceeded the 1 MB preview limit." }, { status: 413 });
      }
      chunks.push(value);
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    const extracted = extractText(html);
    if (!extracted.title && !extracted.excerpt) {
      return NextResponse.json({ error: "No readable page text was found." }, { status: 422 });
    }
    const contentHash = createHash("sha256").update(html).digest("hex");
    const capturedAt = new Date();
    const capture = await prisma.companySourceCapture.upsert({
      where: { sourceId_contentHash: { sourceId: source.id, contentHash } },
      create: {
        sourceId: source.id,
        company: source.company,
        sourceTitle: source.title,
        sourceUrl: source.url,
        retrievedAt: capturedAt,
        httpStatus: response.status,
        contentHash,
        pageTitle: extracted.title,
        description: extracted.description,
        excerpt: extracted.excerpt,
        submittedById: userId,
        status: "pending",
      },
      update: {},
      select: { id: true, status: true, retrievedAt: true },
    });
    return NextResponse.json({
      id: capture.id,
      source: { id: source.id, company: source.company, title: source.title, url: source.url },
      capturedAt: capture.retrievedAt.toISOString(),
      contentHash,
      httpStatus: response.status,
      extracted,
      reviewStatus: capture.status,
      persisted: true,
      duplicateCapture: capture.status !== "pending",
      notice: "Saved for human review. This capture is not an approved hiring requirement. A moderator must inspect the source and captured content before it can be used as trusted evidence.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "The source request timed out." : "The source could not be fetched.";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

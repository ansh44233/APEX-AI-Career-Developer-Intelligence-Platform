import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, enforceUserRateLimit, upsert } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: { companySourceCapture: { upsert } },
}));

import { POST } from "@/app/api/company-intelligence/capture/route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/company-intelligence/capture", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("company source capture route", () => {
  beforeEach(() => {
    getCurrentUserId.mockReset().mockResolvedValue("user-123");
    enforceUserRateLimit.mockReset().mockResolvedValue(null);
    upsert.mockReset().mockResolvedValue({
      id: "capture-123",
      status: "pending",
      retrievedAt: new Date("2026-11-18T12:00:00.000Z"),
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  it("requires authentication before rate limiting or fetching", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await POST(request({ sourceId: "google-products" }));
    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects unregistered source identifiers without fetching", async () => {
    const response = await POST(request({ sourceId: "https://attacker.example/page" }));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("enforces the per-user capture limit before fetching", async () => {
    enforceUserRateLimit.mockResolvedValue(new Response("limited", { status: 429 }));
    const response = await POST(request({ sourceId: "google-products" }));
    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("user-123", "company-source-capture", 5, 3600);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("captures a registered research source into pending human review", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(
      "<html><head><title>Google products</title><meta name=\"description\" content=\"Official catalogue\"></head><body>Search Android Cloud</body></html>",
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
    ));

    const response = await POST(request({ sourceId: "google-products" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toMatchObject({ id: "google-products", company: "Google" });
    expect(body.extracted.title).toBe("Google products");
    expect(body.reviewStatus).toBe("pending");
    expect(body.persisted).toBe(true);
    expect(body.notice).toContain("human review");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { sourceId_contentHash: expect.objectContaining({ sourceId: "google-products" }) },
      create: expect.objectContaining({ sourceId: "google-products", company: "Google", status: "pending", submittedById: "user-123" }),
    }));
  });

  it("does not follow redirects", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, {
      status: 302,
      headers: { location: "https://unregistered.example/landing" },
    }));
    const response = await POST(request({ sourceId: "google-products" }));
    expect(response.status).toBe(422);
    expect(fetch).toHaveBeenCalledWith("https://about.google/products/", expect.objectContaining({ redirect: "manual" }));
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects non-HTML and oversized source responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("binary", {
      status: 200, headers: { "content-type": "application/pdf" },
    }));
    const nonHtml = await POST(request({ sourceId: "google-products" }));
    expect(nonHtml.status).toBe(415);

    vi.mocked(fetch).mockResolvedValueOnce(new Response("too large", {
      status: 200, headers: { "content-type": "text/html", "content-length": "1000001" },
    }));
    const oversized = await POST(request({ sourceId: "google-products" }));
    expect(oversized.status).toBe(413);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("reports an existing reviewed capture without silently resetting its status", async () => {
    upsert.mockResolvedValue({
      id: "capture-existing",
      status: "approved",
      retrievedAt: new Date("2026-11-18T12:00:00.000Z"),
    });
    vi.mocked(fetch).mockResolvedValue(new Response("<title>Google products</title><p>Search Android</p>", {
      status: 200, headers: { "content-type": "text/html" },
    }));

    const response = await POST(request({ sourceId: "google-products" }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.reviewStatus).toBe("approved");
    expect(body.duplicateCapture).toBe(true);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: {},
    }));
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: queryRaw } }));

import { enforceUserRateLimit } from "@/lib/rate-limit";

describe("database-backed API rate limiter", () => {
  beforeEach(() => queryRaw.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("allows a request below the configured limit", async () => {
    queryRaw.mockResolvedValue([{ request_count: 2, window_started_at: new Date() }]);

    const response = await enforceUserRateLimit(
      "11111111-1111-4111-8111-111111111111",
      "agent-message",
      20,
      3600,
    );

    expect(response).toBeNull();
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns 429 and a retry hint after the limit is reached", async () => {
    queryRaw.mockResolvedValue([{ request_count: 6, window_started_at: new Date() }]);

    const response = await enforceUserRateLimit(
      "11111111-1111-4111-8111-111111111111",
      "company-source-capture",
      5,
      3600,
    );

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBeTruthy();
    await expect(response?.json()).resolves.toMatchObject({ error: expect.stringContaining("Rate limit reached") });
  });

  it("fails closed with 503 if the shared counter returns no row", async () => {
    queryRaw.mockResolvedValue([]);

    const response = await enforceUserRateLimit(
      "11111111-1111-4111-8111-111111111111",
      "agent-message",
      20,
      3600,
    );

    expect(response?.status).toBe(503);
  });
});

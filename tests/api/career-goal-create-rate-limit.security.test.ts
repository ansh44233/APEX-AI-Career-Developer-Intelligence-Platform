import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, enforceUserRateLimit, create } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({ prisma: { careerGoal: { create } } }));

import { POST } from "@/app/api/career-goals/route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/career-goals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("career goal creation rate limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("career-goal-user");
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));
  });

  it("blocks valid goal creation before the database write", async () => {
    const response = await POST(request({ targetRole: "Software Engineer", targetCompany: "Example" }));
    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("career-goal-user", "career-goal-create", 20, 60 * 60);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated creation before rate limiting", async () => {
    getCurrentUserId.mockResolvedValue(null);
    const response = await POST(request({ targetRole: "Software Engineer" }));
    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});

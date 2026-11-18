import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, enforceUserRateLimit, createConversation } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  createConversation: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: { agentConversation: { create: createConversation } },
}));

import { POST as createAgentConversation } from "@/app/api/agent/conversations/route";

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agent/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Agent Workbench conversation creation controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("agent-conversation-user");
    enforceUserRateLimit.mockResolvedValue(null);
    createConversation.mockResolvedValue({
      id: "conversation-id",
      skillSlug: "career-copilot",
      title: "Career Copilot conversation",
      createdAt: new Date("2026-11-18T10:00:00.000Z"),
      updatedAt: new Date("2026-11-18T10:00:00.000Z"),
    });
  });

  it("rejects unauthenticated creation before rate limiting or database access", async () => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await createAgentConversation(jsonRequest({ skill: "career-copilot" }));

    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    expect(createConversation).not.toHaveBeenCalled();
  });

  it("validates the request before consuming the creation rate limit", async () => {
    const response = await createAgentConversation(jsonRequest({
      skill: "career-copilot",
      userId: "attacker-selected-user",
    }));

    expect(response.status).toBe(400);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    expect(createConversation).not.toHaveBeenCalled();
  });

  it("stops creation when the per-user limit is reached", async () => {
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));

    const response = await createAgentConversation(jsonRequest({ skill: "career-copilot" }));

    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith(
      "agent-conversation-user",
      "agent-conversation-create",
      10,
      60 * 60,
    );
    expect(createConversation).not.toHaveBeenCalled();
  });

  it("creates a conversation for the authenticated user under the configured limit", async () => {
    const response = await createAgentConversation(jsonRequest({ skill: "career-copilot" }));

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(enforceUserRateLimit).toHaveBeenCalledWith(
      "agent-conversation-user",
      "agent-conversation-create",
      10,
      60 * 60,
    );
    expect(createConversation).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        userId: "agent-conversation-user",
        skillSlug: "career-copilot",
        title: "Career Copilot conversation",
      },
    }));
    expect(await response.json()).toMatchObject({
      conversation: {
        id: "conversation-id",
        skillSlug: "career-copilot",
      },
    });
  });
});

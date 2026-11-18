import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId, proposeAgentTool, enforceUserRateLimit } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  proposeAgentTool: vi.fn(),
  enforceUserRateLimit: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/agent/provider", () => ({ proposeAgentTool }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));

import { POST as proposeTool } from "@/app/api/agent/tool-proposals/route";

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agent/tool-proposals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Agent Workbench tool proposal access controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("agent-proposal-user");
    enforceUserRateLimit.mockResolvedValue(null);
    proposeAgentTool.mockResolvedValue({
      toolId: "text-inspector",
      input: "summarise this",
      reason: "Text statistics may help.",
    });
  });

  it("rejects proposal requests without an authenticated session", async () => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await proposeTool(jsonRequest({ text: "summarise this" }));

    expect(response.status).toBe(401);
    expect(proposeAgentTool).not.toHaveBeenCalled();
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
  });

  it("validates input strictly before rate limiting or asking the provider", async () => {
    const response = await proposeTool(jsonRequest({
      text: "summarise this",
      executeImmediately: true,
    }));

    expect(response.status).toBe(400);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    expect(proposeAgentTool).not.toHaveBeenCalled();
  });

  it("returns a proposal as unexecuted and explicitly requiring user approval", async () => {
    const response = await proposeTool(jsonRequest({ text: "summarise this" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(enforceUserRateLimit).toHaveBeenCalledWith("agent-proposal-user", "agent-tool-proposal", 8, 60 * 60);
    expect(proposeAgentTool).toHaveBeenCalledWith("summarise this");
    expect(await response.json()).toEqual({
      proposal: {
        toolId: "text-inspector",
        input: "summarise this",
        reason: "Text statistics may help.",
      },
      requiresApproval: true,
      executed: false,
    });
  });

  it("does not execute or imply approval when the provider declines a proposal", async () => {
    proposeAgentTool.mockResolvedValue(null);

    const response = await proposeTool(jsonRequest({ text: "ordinary text" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      proposal: null,
      requiresApproval: false,
      executed: false,
    });
  });

  it("stops before calling the provider when the rate limit is reached", async () => {
    const limited = new Response(JSON.stringify({ error: "Rate limit reached." }), {
      status: 429,
      headers: { "content-type": "application/json" },
    });
    enforceUserRateLimit.mockResolvedValue(limited);

    const response = await proposeTool(jsonRequest({ text: "summarise this" }));

    expect(response.status).toBe(429);
    expect(proposeAgentTool).not.toHaveBeenCalled();
  });
});

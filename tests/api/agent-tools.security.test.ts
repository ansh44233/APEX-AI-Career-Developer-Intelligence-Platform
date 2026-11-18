import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getCurrentUserId } = vi.hoisted(() => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));

import { GET as listTools, POST as executeTool } from "@/app/api/agent/tools/route";

const USER_ID = "agent-tool-user-123";

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/agent/tools", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Agent Workbench tool execution access controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue(USER_ID);
  });

  it("rejects listing tools without an authenticated session", async () => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await listTools();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required." });
  });

  it("lists only the fixed allowlisted tools with no-store caching", async () => {
    const response = await listTools();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload.tools.map((tool: { id: string }) => tool.id)).toEqual([
      "text-inspector",
      "skill-term-extractor",
    ]);
  });

  it("rejects tool execution without an authenticated session", async () => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await executeTool(jsonRequest({
      toolId: "text-inspector",
      input: "private text",
      approved: true,
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required." });
  });

  it("does not execute a tool when explicit approval is absent or false", async () => {
    for (const approved of [undefined, false]) {
      const body = { toolId: "text-inspector", input: "one two", ...(approved === undefined ? {} : { approved }) };
      const response = await executeTool(jsonRequest(body));
      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain("Explicit approval is required");
    }
  });

  it("rejects unlisted tool identifiers and unexpected request properties", async () => {
    const invalidTool = await executeTool(jsonRequest({
      toolId: "shell",
      input: "whoami",
      approved: true,
    }));
    const unexpectedProperty = await executeTool(jsonRequest({
      toolId: "text-inspector",
      input: "one two",
      approved: true,
      executeImmediately: true,
    }));

    expect(invalidTool.status).toBe(400);
    expect(unexpectedProperty.status).toBe(400);
  });

  it("executes the allowlisted tool only after explicit approval", async () => {
    const response = await executeTool(jsonRequest({
      toolId: "text-inspector",
      input: "one two\nthree",
      approved: true,
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      execution: {
        toolId: "text-inspector",
        result: { characters: 13, words: 3, nonEmptyLines: 2 },
      },
      persisted: false,
    });
  });
});

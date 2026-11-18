import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUserId, enforceUserRateLimit, careerGoalFindMany, roadmapCreateMany, roadmapFindMany, claimFindMany } = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  enforceUserRateLimit: vi.fn(),
  careerGoalFindMany: vi.fn(),
  roadmapCreateMany: vi.fn(),
  roadmapFindMany: vi.fn(),
  claimFindMany: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getCurrentUserId }));
vi.mock("@/lib/rate-limit", () => ({ enforceUserRateLimit }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    careerGoal: { findMany: careerGoalFindMany },
    careerRoadmapTask: { createMany: roadmapCreateMany, findMany: roadmapFindMany },
    companyEvidenceClaim: { findMany: claimFindMany },
  },
}));

import { GET as graphGET } from "@/app/api/intelligence/graph/route";
import { GET as roadmapGET } from "@/app/api/intelligence/roadmap/route";

describe("career graph and roadmap read limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserId.mockResolvedValue("career-user");
    enforceUserRateLimit.mockResolvedValue(new Response(
      JSON.stringify({ error: "Rate limit reached." }),
      { status: 429, headers: { "content-type": "application/json" } },
    ));
  });

  it.each([
    { name: "career intelligence graph", run: graphGET, bucket: "intelligence-graph-read" },
    { name: "career roadmap", run: roadmapGET, bucket: "intelligence-roadmap-read" },
  ])("blocks $name database reads and writes after the limit", async ({ run, bucket }) => {
    const response = await run();

    expect(response.status).toBe(429);
    expect(enforceUserRateLimit).toHaveBeenCalledWith("career-user", bucket, 20, 60 * 60);
    expect(careerGoalFindMany).not.toHaveBeenCalled();
    expect(roadmapCreateMany).not.toHaveBeenCalled();
    expect(roadmapFindMany).not.toHaveBeenCalled();
    expect(claimFindMany).not.toHaveBeenCalled();
  });

  it.each([
    { name: "career intelligence graph", run: graphGET },
    { name: "career roadmap", run: roadmapGET },
  ])("rejects unauthenticated $name requests before database work", async ({ run }) => {
    getCurrentUserId.mockResolvedValue(null);

    const response = await run();

    expect(response.status).toBe(401);
    expect(enforceUserRateLimit).not.toHaveBeenCalled();
    expect(careerGoalFindMany).not.toHaveBeenCalled();
    expect(roadmapCreateMany).not.toHaveBeenCalled();
    expect(roadmapFindMany).not.toHaveBeenCalled();
    expect(claimFindMany).not.toHaveBeenCalled();
  });
});

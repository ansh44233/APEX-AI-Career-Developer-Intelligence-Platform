import { z } from "zod";
import { isApexSkillSlug } from "@/lib/skills/registry";

export const agentRequestSchema = z.object({
  skill: z.string().refine(isApexSkillSlug, "Choose a published APEX skill."),
  message: z.string().trim().min(1).max(5_000),
}).strict();

export function parseAgentRequest(input: unknown) {
  return agentRequestSchema.safeParse(input);
}

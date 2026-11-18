import { z } from "zod";
import { isApexSkillSlug } from "@/lib/skills/registry";

export const createAgentConversationSchema = z.object({
  skill: z.string().refine(isApexSkillSlug, "Choose a published APEX skill."),
}).strict();

export const sendAgentMessageSchema = z.object({
  message: z.string().trim().min(1).max(5_000),
  includeCareerContext: z.boolean().optional().default(false),
}).strict();

export const parseCreateAgentConversation = (input: unknown) =>
  createAgentConversationSchema.safeParse(input);

export const parseSendAgentMessage = (input: unknown) =>
  sendAgentMessageSchema.safeParse(input);

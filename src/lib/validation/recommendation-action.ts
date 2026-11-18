import { z } from "zod";

export const recommendationActionSchema = z.object({
  sourceKey: z.string().trim().min(3).max(160).regex(/^(skill|coverage|roadmap)-[a-z0-9_-]+$/i),
  title: z.string().trim().min(2).max(120),
  reason: z.string().trim().min(1).max(1_000),
  href: z.string().trim().min(1).max(300).refine(value => value.startsWith("/features/"), "Only internal APEX feature links are allowed."),
  basis: z.string().trim().min(1).max(40),
  action: z.enum(["accepted", "deferred", "dismissed"]),
  goalId: z.string().uuid().nullable().optional(),
  jobId: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
}).strict();

export const completeRecommendationActionSchema = z.object({
  action: z.literal("complete"),
}).strict();

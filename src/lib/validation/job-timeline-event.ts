import { z } from "zod";

export const jobEventTypeSchema = z.enum(["deadline", "follow_up", "interview", "assessment", "other"]);
export const jobEventStatusSchema = z.enum(["pending", "completed", "cancelled"]);

export const createJobEventSchema = z.object({
  jobId: z.string().uuid(),
  eventType: jobEventTypeSchema,
  title: z.string().trim().min(2).max(120),
  details: z.string().trim().max(1_000).nullable().optional(),
  scheduledAt: z.string().datetime({ offset: true }),
}).strict();

export const updateJobEventSchema = z.object({
  eventType: jobEventTypeSchema.optional(),
  title: z.string().trim().min(2).max(120).optional(),
  details: z.string().trim().max(1_000).nullable().optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  status: jobEventStatusSchema.optional(),
}).strict().refine(value => Object.keys(value).length > 0, { message: "At least one field is required." });

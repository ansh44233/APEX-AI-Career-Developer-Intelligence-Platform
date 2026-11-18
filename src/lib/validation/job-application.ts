import { z } from "zod";

export const jobStatusSchema = z.enum(["saved", "applied", "interview", "offer", "rejected", "withdrawn"]);

const optionalHttpUrl = z.string().trim().max(2_000).url().refine((value) => {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}, "URL must use HTTP or HTTPS.").nullable().optional();

export const createJobApplicationSchema = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(2).max(160),
  location: z.string().trim().max(120).nullable().optional(),
  sourceUrl: optionalHttpUrl,
  jobDescription: z.string().trim().min(30).max(20_000),
  goalId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(4_000).nullable().optional(),
}).strict();

export const updateJobApplicationSchema = z.object({
  company: z.string().trim().min(1).max(120).optional(),
  role: z.string().trim().min(2).max(160).optional(),
  location: z.string().trim().max(120).nullable().optional(),
  sourceUrl: optionalHttpUrl,
  jobDescription: z.string().trim().min(30).max(20_000).optional(),
  goalId: z.string().uuid().nullable().optional(),
  status: jobStatusSchema.optional(),
  appliedAt: z.string().date().nullable().optional(),
  notes: z.string().trim().max(4_000).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: "At least one field is required." });

export function parseCreateJobApplication(input: unknown) { return createJobApplicationSchema.safeParse(input); }
export function parseUpdateJobApplication(input: unknown) { return updateJobApplicationSchema.safeParse(input); }

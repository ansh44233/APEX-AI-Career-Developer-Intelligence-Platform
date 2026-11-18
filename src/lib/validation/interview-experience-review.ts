import { z } from "zod";

export const reviewInterviewExperienceSchema = z.object({
  reportId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reviewNote: z.string().trim().max(500).nullable().optional(),
}).strict();

export function parseReviewInterviewExperience(input: unknown) {
  return reviewInterviewExperienceSchema.safeParse(input);
}

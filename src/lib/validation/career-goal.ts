import { z } from "zod";

export const careerGoalStatusSchema = z.enum([
  "active",
  "paused",
  "completed",
  "archived",
]);

const targetDateSchema = z.string().date();

export const createCareerGoalSchema = z.object({
  targetRole: z.string().trim().min(2).max(120),
  targetCompany: z.string().trim().max(120).nullable().optional(),
  targetDate: targetDateSchema.nullable().optional(),
}).strict();

export const updateCareerGoalSchema = z.object({
  targetRole: z.string().trim().min(2).max(120).optional(),
  targetCompany: z.string().trim().max(120).nullable().optional(),
  targetDate: targetDateSchema.nullable().optional(),
  status: careerGoalStatusSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field must be provided.",
});

export function parseCreateCareerGoal(input: unknown) {
  return createCareerGoalSchema.safeParse(input);
}

export function parseUpdateCareerGoal(input: unknown) {
  return updateCareerGoalSchema.safeParse(input);
}

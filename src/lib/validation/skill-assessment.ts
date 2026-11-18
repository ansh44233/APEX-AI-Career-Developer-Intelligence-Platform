import { z } from "zod";

export const createSkillAssessmentSchema = z.object({
  skillKey: z.string().trim().min(2).max(80).regex(/^[a-zA-Z0-9 _.-]+$/),
  rating: z.number().int().min(1).max(5),
  evidenceNote: z.string().trim().max(2000).optional().nullable(),
  goalId: z.string().uuid().optional().nullable(),
}).strict();

export const updateSkillAssessmentSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  evidenceNote: z.string().trim().max(2000).optional().nullable(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "Provide a rating or evidence note to update.",
});

export function parseCreateSkillAssessment(input: unknown) {
  return createSkillAssessmentSchema.safeParse(input);
}

export function parseUpdateSkillAssessment(input: unknown) {
  return updateSkillAssessmentSchema.safeParse(input);
}

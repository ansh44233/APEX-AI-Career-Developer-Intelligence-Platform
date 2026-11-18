import { z } from "zod";

export const practiceModuleSchema = z.enum([
  "interview",
  "coding",
  "system_design",
  "resume",
  "project_defense",
]);

export const createPracticeSessionSchema = z.object({
  module: practiceModuleSchema,
  title: z.string().trim().min(1).max(120),
  goalId: z.string().uuid().optional(),
}).strict();

export const createPracticeAttemptSchema = z.object({
  prompt: z.string().trim().min(1).max(8_000),
  responseText: z.string().max(20_000).optional(),
}).strict();

export type CreatePracticeSessionInput = z.infer<
  typeof createPracticeSessionSchema
>;
export type CreatePracticeAttemptInput = z.infer<
  typeof createPracticeAttemptSchema
>;

/**
 * Validate untrusted request JSON before it reaches domain logic or Prisma.
 * Route handlers must still authenticate the caller and enforce record ownership.
 */
export function parseCreatePracticeSession(input: unknown) {
  return createPracticeSessionSchema.safeParse(input);
}

export function parseCreatePracticeAttempt(input: unknown) {
  return createPracticeAttemptSchema.safeParse(input);
}


export const practiceEvaluationSchema = z.object({
  attemptId: z.string().uuid(),
  rubric: z.array(z.object({
    key: z.string().trim().min(1).max(60),
    rating: z.number().int().min(1).max(5),
    note: z.string().trim().max(500).optional(),
  }).strict()).min(1).max(8),
  strengths: z.string().trim().max(2000).optional(),
  improvementAreas: z.string().trim().max(2000).optional(),
  nextAction: z.string().trim().max(1000).optional(),
}).strict().refine(value => new Set(value.rubric.map(item => item.key)).size === value.rubric.length, {
  message: "Rubric keys must be unique.",
  path: ["rubric"],
});

export function parsePracticeEvaluation(input: unknown) {
  return practiceEvaluationSchema.safeParse(input);
}

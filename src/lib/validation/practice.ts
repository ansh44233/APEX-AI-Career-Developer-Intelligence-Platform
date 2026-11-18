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

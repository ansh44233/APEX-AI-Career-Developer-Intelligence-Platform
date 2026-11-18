import "server-only";

import { z } from "zod";

const serverEnvSchema = z
  .object({
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .url("DATABASE_URL must be a valid PostgreSQL URL")
      .refine(
        value => value.startsWith("postgresql://") || value.startsWith("postgres://"),
        "DATABASE_URL must use the postgresql:// or postgres:// scheme",
      ),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must contain at least 32 characters"),
    BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid absolute URL"),
    AI_BASE_URL: z.string().url().optional(),
    AI_API_KEY: z.string().min(1).optional(),
    AI_MODEL: z.string().min(1).optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  })
  .superRefine((value, ctx) => {
    const aiFields = [value.AI_BASE_URL, value.AI_API_KEY, value.AI_MODEL];
    const configuredCount = aiFields.filter(Boolean).length;
    if (configuredCount > 0 && configuredCount < aiFields.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["AI_API_KEY"],
        message: "AI_BASE_URL, AI_API_KEY and AI_MODEL must be configured together",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map(issue => `${issue.path.join(".") || "environment"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment configuration: ${details}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

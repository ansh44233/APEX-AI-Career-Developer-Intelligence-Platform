import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { getServerEnv } from "@/lib/env";

const env = getServerEnv();
const baseURL = env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL!;

export const auth = betterAuth({
  appName: "APEX",
  baseURL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  advanced: {
    database: { generateId: "uuid" },
    cookiePrefix: "apex",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Keep cached session data short-lived to reduce the window for stale revoked sessions.
      cookieCache: { enabled: true, maxAge: 60 },
  },
  // Vercel assigns deployment-specific hostnames that differ from the branch alias.
  // Trust the exact hostnames supplied by Vercel at runtime, in addition to the
  // explicitly configured canonical app origins.
  trustedOrigins: [
    ...new Set(
      [
        baseURL,
        env.NEXT_PUBLIC_APP_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
      ].filter((origin): origin is string => Boolean(origin)),
    ),
  ],
  plugins: [nextCookies()],
});

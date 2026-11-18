import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RateLimitRow = {
  request_count: number;
  window_started_at: Date;
};

/**
 * A PostgreSQL-backed fixed-window limiter. The unique (user, bucket) row and
 * atomic upsert make the counter shared across application instances.
 * Fails closed: callers receive 503 if the limiter cannot reach the database.
 */
export async function enforceUserRateLimit(
  userId: string,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "api_rate_limit_counters"
      ("id", "user_id", "bucket", "window_started_at", "request_count", "updated_at")
    VALUES
      (gen_random_uuid(), ${userId}::uuid, ${bucket}, NOW(), 1, NOW())
    ON CONFLICT ("user_id", "bucket") DO UPDATE SET
      "request_count" = CASE
        WHEN "api_rate_limit_counters"."window_started_at"
          <= NOW() - (${windowSeconds} * INTERVAL '1 second')
        THEN 1
        ELSE "api_rate_limit_counters"."request_count" + 1
      END,
      "window_started_at" = CASE
        WHEN "api_rate_limit_counters"."window_started_at"
          <= NOW() - (${windowSeconds} * INTERVAL '1 second')
        THEN NOW()
        ELSE "api_rate_limit_counters"."window_started_at"
      END,
      "updated_at" = NOW()
    RETURNING "request_count", "window_started_at"
  `;

  const row = rows[0];
  if (!row) {
    return NextResponse.json(
      { error: "Rate limiting is temporarily unavailable. Try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const allowed = row.request_count <= limit;
  const resetAt = new Date(row.window_started_at).getTime() + windowSeconds * 1000;
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  const headers = {
    "Cache-Control": "no-store",
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, limit - row.request_count)),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
    ...(allowed ? {} : { "Retry-After": String(retryAfterSeconds) }),
  };

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit reached. Please wait before trying this action again.", retryAfterSeconds },
      { status: 429, headers },
    );
  }

  return null;
}

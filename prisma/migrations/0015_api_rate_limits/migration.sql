CREATE TABLE "api_rate_limit_counters" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "bucket" VARCHAR(120) NOT NULL,
  "window_started_at" TIMESTAMPTZ(6) NOT NULL,
  "request_count" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_rate_limit_counters_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "api_rate_limit_counters_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "api_rate_limit_counters_request_count_check" CHECK ("request_count" >= 0)
);

CREATE UNIQUE INDEX "api_rate_limit_counters_user_id_bucket_key"
  ON "api_rate_limit_counters"("user_id", "bucket");

CREATE INDEX "api_rate_limit_counters_updated_at_idx"
  ON "api_rate_limit_counters"("updated_at");

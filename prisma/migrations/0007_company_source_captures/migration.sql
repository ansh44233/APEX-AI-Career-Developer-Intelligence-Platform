CREATE TABLE "company_source_captures" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source_id" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "source_title" TEXT NOT NULL,
  "source_url" TEXT NOT NULL,
  "retrieved_at" TIMESTAMPTZ(6) NOT NULL,
  "http_status" INTEGER NOT NULL,
  "content_hash" TEXT NOT NULL,
  "page_title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "submitted_by_id" UUID NOT NULL,
  "reviewed_by_id" UUID,
  "review_note" TEXT,
  "reviewed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_source_captures_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_source_captures_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected')),
  CONSTRAINT "company_source_captures_http_status_check" CHECK ("http_status" BETWEEN 100 AND 599),
  CONSTRAINT "company_source_captures_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "company_source_captures_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "company_source_captures_source_id_content_hash_key" ON "company_source_captures"("source_id", "content_hash");
CREATE INDEX "company_source_captures_status_created_at_idx" ON "company_source_captures"("status", "created_at");
CREATE INDEX "company_source_captures_company_source_id_retrieved_at_idx" ON "company_source_captures"("company", "source_id", "retrieved_at" DESC);

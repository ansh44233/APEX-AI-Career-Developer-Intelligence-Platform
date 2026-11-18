ALTER TABLE "users"
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

ALTER TABLE "interview_experience_reports"
  ADD COLUMN "content_hash" TEXT,
  ADD COLUMN "review_note" TEXT,
  ADD COLUMN "reviewed_by_user_id" UUID;

-- Backfill existing rows with a stable placeholder. New submissions always use SHA-256.
UPDATE "interview_experience_reports"
SET "content_hash" = md5(lower(trim("company")) || '|' || lower(trim("role")) || '|' || lower(trim("round_type")) || '|' || lower(trim("question_text")))
WHERE "content_hash" IS NULL;

ALTER TABLE "interview_experience_reports"
  ALTER COLUMN "content_hash" SET NOT NULL;

CREATE INDEX "interview_experience_reports_content_hash_status_idx"
  ON "interview_experience_reports"("content_hash", "status");

CREATE INDEX "interview_experience_reports_status_created_at_idx"
  ON "interview_experience_reports"("status", "created_at" DESC);

ALTER TABLE "interview_experience_reports"
  ADD CONSTRAINT "interview_experience_reports_reviewed_by_user_id_fkey"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users"
  ADD CONSTRAINT "users_role_check"
  CHECK ("role" IN ('user', 'moderator', 'admin'));

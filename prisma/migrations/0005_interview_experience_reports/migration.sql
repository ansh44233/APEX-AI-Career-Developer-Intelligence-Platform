CREATE TABLE "interview_experience_reports" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "experience_level" TEXT NOT NULL,
  "round_type" TEXT NOT NULL,
  "difficulty" TEXT NOT NULL,
  "interview_date" DATE,
  "question_text" TEXT NOT NULL,
  "experience_note" TEXT,
  "source_url" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "interview_experience_reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "interview_experience_reports_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "interview_experience_reports_status_check"
    CHECK ("status" IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX "interview_experience_reports_status_company_role_idx"
  ON "interview_experience_reports"("status", "company", "role");
CREATE INDEX "interview_experience_reports_user_id_created_at_idx"
  ON "interview_experience_reports"("user_id", "created_at" DESC);

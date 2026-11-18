CREATE TABLE "job_applications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "goal_id" UUID,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "location" TEXT,
  "source_url" TEXT,
  "job_description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'saved',
  "applied_at" DATE,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_applications_status_check" CHECK ("status" IN ('saved', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_applications_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "career_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "job_applications_user_id_status_updated_at_idx" ON "job_applications"("user_id", "status", "updated_at" DESC);
CREATE INDEX "job_applications_goal_id_idx" ON "job_applications"("goal_id");

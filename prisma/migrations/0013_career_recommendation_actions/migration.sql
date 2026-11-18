CREATE TABLE "career_recommendation_actions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "goal_id" UUID,
  "job_id" UUID,
  "roadmap_task_id" UUID,
  "source_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "basis" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'accepted',
  "due_at" TIMESTAMPTZ(6),
  "accepted_at" TIMESTAMPTZ(6),
  "completed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "career_recommendation_actions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "career_recommendation_actions_status_check" CHECK ("status" IN ('accepted', 'deferred', 'dismissed', 'completed')),
  CONSTRAINT "career_recommendation_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "career_recommendation_actions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "career_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "career_recommendation_actions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "career_recommendation_actions_roadmap_task_id_fkey" FOREIGN KEY ("roadmap_task_id") REFERENCES "career_roadmap_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "career_recommendation_actions_user_id_source_key_key" ON "career_recommendation_actions"("user_id", "source_key");
CREATE INDEX "career_recommendation_actions_user_id_status_due_at_idx" ON "career_recommendation_actions"("user_id", "status", "due_at");
CREATE INDEX "career_recommendation_actions_goal_id_idx" ON "career_recommendation_actions"("goal_id");
CREATE INDEX "career_recommendation_actions_job_id_idx" ON "career_recommendation_actions"("job_id");

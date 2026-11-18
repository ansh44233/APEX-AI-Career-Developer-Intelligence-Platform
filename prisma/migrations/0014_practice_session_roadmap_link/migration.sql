ALTER TABLE "practice_sessions"
ADD COLUMN "roadmap_task_id" UUID;

ALTER TABLE "practice_sessions"
ADD CONSTRAINT "practice_sessions_roadmap_task_id_fkey"
FOREIGN KEY ("roadmap_task_id") REFERENCES "career_roadmap_tasks"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "practice_sessions_roadmap_task_id_started_at_idx"
ON "practice_sessions"("roadmap_task_id", "started_at" DESC);

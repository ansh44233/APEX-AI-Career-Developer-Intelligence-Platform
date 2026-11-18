CREATE TABLE "job_preparation_tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "job_id" UUID NOT NULL,
  "skill_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'todo',
  "sort_order" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_preparation_tasks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_preparation_tasks_status_check" CHECK ("status" IN ('todo', 'in_progress', 'completed')),
  CONSTRAINT "job_preparation_tasks_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "job_preparation_tasks_job_id_skill_key_key" ON "job_preparation_tasks"("job_id", "skill_key");
CREATE INDEX "job_preparation_tasks_job_id_status_sort_order_idx" ON "job_preparation_tasks"("job_id", "status", "sort_order");

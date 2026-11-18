CREATE TABLE "job_timeline_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "job_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "event_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "details" TEXT,
  "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "completed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_timeline_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_timeline_events_type_check" CHECK ("event_type" IN ('deadline', 'follow_up', 'interview', 'assessment', 'other')),
  CONSTRAINT "job_timeline_events_status_check" CHECK ("status" IN ('pending', 'completed', 'cancelled')),
  CONSTRAINT "job_timeline_events_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "job_timeline_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "job_timeline_events_user_id_status_scheduled_at_idx" ON "job_timeline_events"("user_id", "status", "scheduled_at");
CREATE INDEX "job_timeline_events_job_id_scheduled_at_idx" ON "job_timeline_events"("job_id", "scheduled_at");

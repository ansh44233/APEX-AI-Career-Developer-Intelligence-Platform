ALTER TABLE "career_roadmap_tasks"
ADD COLUMN "evidence_claim_id" UUID;

ALTER TABLE "career_roadmap_tasks"
ADD CONSTRAINT "career_roadmap_tasks_evidence_claim_id_fkey"
FOREIGN KEY ("evidence_claim_id") REFERENCES "company_evidence_claims"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "career_roadmap_tasks_evidence_claim_id_idx"
ON "career_roadmap_tasks"("evidence_claim_id");

CREATE UNIQUE INDEX "career_roadmap_tasks_goal_id_evidence_claim_id_key"
ON "career_roadmap_tasks"("goal_id", "evidence_claim_id")
WHERE "evidence_claim_id" IS NOT NULL;

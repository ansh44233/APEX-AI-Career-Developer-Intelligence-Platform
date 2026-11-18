CREATE TABLE "company_evidence_claims" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "capture_id" UUID NOT NULL,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "claim_type" TEXT NOT NULL,
  "claim_text" TEXT NOT NULL,
  "supporting_excerpt" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_by_id" UUID NOT NULL,
  "reviewed_by_id" UUID,
  "review_note" TEXT,
  "reviewed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_evidence_claims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "company_evidence_claims_type_check" CHECK ("claim_type" IN ('explicit_requirement', 'employer_guidance')),
  CONSTRAINT "company_evidence_claims_status_check" CHECK ("status" IN ('pending', 'approved', 'rejected')),
  CONSTRAINT "company_evidence_claims_capture_id_fkey" FOREIGN KEY ("capture_id") REFERENCES "company_source_captures"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "company_evidence_claims_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "company_evidence_claims_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "company_evidence_claims_status_company_role_idx" ON "company_evidence_claims"("status", "company", "role");
CREATE INDEX "company_evidence_claims_capture_id_idx" ON "company_evidence_claims"("capture_id");

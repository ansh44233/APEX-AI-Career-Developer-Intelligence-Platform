CREATE TABLE "question_bank_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "follow_up" TEXT NOT NULL,
    "topics" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "evaluation" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "hint" TEXT NOT NULL,
    "company_context" TEXT NOT NULL DEFAULT 'General practice',
    "fingerprint" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "is_saved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "question_bank_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "question_bank_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "question_bank_items_user_id_fingerprint_key" ON "question_bank_items"("user_id", "fingerprint");
CREATE INDEX "question_bank_items_user_id_created_at_idx" ON "question_bank_items"("user_id", "created_at" DESC);
CREATE INDEX "question_bank_items_user_id_category_difficulty_idx" ON "question_bank_items"("user_id", "category", "difficulty");

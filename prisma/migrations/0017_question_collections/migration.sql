ALTER TABLE "question_bank_items" ADD COLUMN IF NOT EXISTS "is_saved" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "question_collections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "question_collections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "question_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "question_collections_user_id_name_key" ON "question_collections"("user_id", "name");
CREATE INDEX "question_collections_user_id_created_at_idx" ON "question_collections"("user_id", "created_at" DESC);
CREATE TABLE "question_collection_items" (
  "collection_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "question_collection_items_pkey" PRIMARY KEY ("collection_id", "question_id"),
  CONSTRAINT "question_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "question_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "question_collection_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question_bank_items"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "question_collection_items_question_id_idx" ON "question_collection_items"("question_id");

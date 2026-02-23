-- AlterTable
ALTER TABLE "HomeSection"
ADD COLUMN "key" TEXT,
ADD COLUMN "ctaText" TEXT,
ADD COLUMN "ctaHref" TEXT;

-- Backfill key for existing rows
UPDATE "HomeSection"
SET "key" = CONCAT('section_', "order", '_', SUBSTRING("id" FROM 1 FOR 6))
WHERE "key" IS NULL;

-- Make key required
ALTER TABLE "HomeSection"
ALTER COLUMN "key" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "HomeSection_key_key" ON "HomeSection"("key");

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "slug" TEXT;

-- Backfill slugs for existing records
WITH numbered_profiles AS (
  SELECT
    id,
    CASE
      WHEN base_slug = '' THEN CONCAT('profile-', row_number() OVER (ORDER BY id))
      WHEN row_number() OVER (PARTITION BY base_slug ORDER BY id) = 1 THEN base_slug
      ELSE CONCAT(base_slug, '-', row_number() OVER (PARTITION BY base_slug ORDER BY id))
    END AS generated_slug
  FROM (
    SELECT
      id,
      trim(BOTH '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) AS base_slug
    FROM "Profile"
  ) base
)
UPDATE "Profile" p
SET "slug" = np.generated_slug
FROM numbered_profiles np
WHERE p.id = np.id;

ALTER TABLE "Profile" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");

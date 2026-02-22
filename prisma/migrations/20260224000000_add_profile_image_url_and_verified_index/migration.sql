-- Add imageUrl field for single canonical display image
ALTER TABLE "Profile"
ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '';

-- Add index for verification filter
CREATE INDEX "Profile_verified_idx" ON "Profile"("verified");

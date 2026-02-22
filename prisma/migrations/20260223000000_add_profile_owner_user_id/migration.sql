-- AlterTable
ALTER TABLE "Profile"
ADD COLUMN "ownerUserId" TEXT;

-- CreateIndex
CREATE INDEX "Profile_ownerUserId_idx" ON "Profile"("ownerUserId");

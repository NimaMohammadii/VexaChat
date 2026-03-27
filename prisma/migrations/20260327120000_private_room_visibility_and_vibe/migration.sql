-- Add public/private visibility and vibe metadata for private rooms
ALTER TABLE "PrivateRoom"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "vibe" TEXT;

CREATE INDEX "PrivateRoom_isPublic_status_idx" ON "PrivateRoom"("isPublic", "status");

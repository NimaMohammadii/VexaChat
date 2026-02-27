-- AlterTable
ALTER TABLE "NoirQueue"
ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN "sessionId" TEXT,
ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE INDEX "NoirQueue_countryCode_status_idx" ON "NoirQueue"("countryCode", "status");

-- CreateIndex
CREATE INDEX "NoirQueue_sessionId_status_idx" ON "NoirQueue"("sessionId", "status");

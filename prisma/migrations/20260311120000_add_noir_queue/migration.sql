-- CreateTable
CREATE TABLE "NoirQueue" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoirQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoirQueue_status_idx" ON "NoirQueue"("status");

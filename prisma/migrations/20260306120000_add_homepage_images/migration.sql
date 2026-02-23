CREATE TABLE "HomepageImage" (
    "id" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomepageImage_slot_order_idx" ON "HomepageImage"("slot", "order");

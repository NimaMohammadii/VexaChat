-- CreateTable
CREATE TABLE "MeetCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "lookingFor" TEXT NOT NULL,
    "intentTags" TEXT[],
    "bio" TEXT,
    "imageUrl" TEXT NOT NULL,
    "isAdultConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "adultConfirmedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetLike" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetPass" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetPass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetBlock" (
    "id" TEXT NOT NULL,
    "blockerUserId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetReport" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetCard_userId_key" ON "MeetCard"("userId");

-- CreateIndex
CREATE INDEX "MeetCard_city_idx" ON "MeetCard"("city");

-- CreateIndex
CREATE INDEX "MeetCard_gender_idx" ON "MeetCard"("gender");

-- CreateIndex
CREATE INDEX "MeetCard_lookingFor_idx" ON "MeetCard"("lookingFor");

-- CreateIndex
CREATE INDEX "MeetCard_isActive_idx" ON "MeetCard"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MeetLike_fromUserId_toUserId_key" ON "MeetLike"("fromUserId", "toUserId");

-- CreateIndex
CREATE INDEX "MeetLike_toUserId_idx" ON "MeetLike"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetPass_fromUserId_toUserId_key" ON "MeetPass"("fromUserId", "toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetBlock_blockerUserId_blockedUserId_key" ON "MeetBlock"("blockerUserId", "blockedUserId");

-- CreateIndex
CREATE INDEX "MeetReport_reportedUserId_idx" ON "MeetReport"("reportedUserId");

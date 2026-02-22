-- CreateTable
CREATE TABLE "MeetCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "lookingFor" TEXT NOT NULL,
    "bio" TEXT,
    "questionPrompt" TEXT,
    "answer" TEXT,
    "imageUrls" TEXT[],
    "isAdultConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "adultConfirmedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MeetCard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetLike" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetLike_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetPass" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetPass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetFollow" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetFollow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetReport" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetBlock" (
    "id" TEXT NOT NULL,
    "blockerUserId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MeetCard_userId_key" ON "MeetCard"("userId");
CREATE INDEX "MeetCard_city_idx" ON "MeetCard"("city");
CREATE INDEX "MeetCard_gender_idx" ON "MeetCard"("gender");
CREATE INDEX "MeetCard_lookingFor_idx" ON "MeetCard"("lookingFor");
CREATE INDEX "MeetCard_isActive_idx" ON "MeetCard"("isActive");

CREATE UNIQUE INDEX "MeetLike_fromUserId_toUserId_key" ON "MeetLike"("fromUserId", "toUserId");
CREATE INDEX "MeetLike_toUserId_idx" ON "MeetLike"("toUserId");

CREATE UNIQUE INDEX "MeetPass_fromUserId_toUserId_key" ON "MeetPass"("fromUserId", "toUserId");
CREATE UNIQUE INDEX "MeetFollow_fromUserId_toUserId_key" ON "MeetFollow"("fromUserId", "toUserId");
CREATE INDEX "MeetReport_reportedUserId_idx" ON "MeetReport"("reportedUserId");
CREATE UNIQUE INDEX "MeetBlock_blockerUserId_blockedUserId_key" ON "MeetBlock"("blockerUserId", "blockedUserId");

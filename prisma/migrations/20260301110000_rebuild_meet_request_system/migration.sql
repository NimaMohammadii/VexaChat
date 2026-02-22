-- Drop old MVP tables
DROP TABLE IF EXISTS "MeetLike";
DROP TABLE IF EXISTS "MeetReport";

-- Remove old indexes no longer in schema
DROP INDEX IF EXISTS "MeetCard_city_idx";
DROP INDEX IF EXISTS "MeetCard_gender_idx";
DROP INDEX IF EXISTS "MeetCard_lookingFor_idx";
DROP INDEX IF EXISTS "MeetCard_isActive_idx";
DROP INDEX IF EXISTS "MeetPass_fromUserId_toUserId_key";

-- New request state enum
CREATE TYPE "MeetRequestStatus" AS ENUM ('pending', 'accepted', 'rejected', 'canceled');

-- Request-based matching entities
CREATE TABLE "MeetLikeRequest" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" "MeetRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetLikeRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetMatch" (
    "id" TEXT NOT NULL,
    "userLowId" TEXT NOT NULL,
    "userHighId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetMatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MeetLikeRequest_fromUserId_toUserId_key" ON "MeetLikeRequest"("fromUserId", "toUserId");
CREATE INDEX "MeetLikeRequest_toUserId_status_idx" ON "MeetLikeRequest"("toUserId", "status");
CREATE UNIQUE INDEX "MeetMatch_userLowId_userHighId_key" ON "MeetMatch"("userLowId", "userHighId");

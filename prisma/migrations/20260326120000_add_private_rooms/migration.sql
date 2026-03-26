-- CreateEnum
CREATE TYPE "PrivateRoomStatus" AS ENUM ('active', 'ended');

-- CreateEnum
CREATE TYPE "PrivateRoomParticipantRole" AS ENUM ('owner', 'participant');

-- CreateEnum
CREATE TYPE "PrivateRoomInviteStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateTable
CREATE TABLE "PrivateRoom" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT,
    "enableTextChat" BOOLEAN NOT NULL DEFAULT true,
    "status" "PrivateRoomStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateRoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PrivateRoomParticipantRole" NOT NULL DEFAULT 'participant',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "PrivateRoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateRoomInvite" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "inviterUserId" TEXT NOT NULL,
    "invitedUserId" TEXT NOT NULL,
    "status" "PrivateRoomInviteStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateRoomInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivateRoom_roomCode_key" ON "PrivateRoom"("roomCode");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateRoom_channelName_key" ON "PrivateRoom"("channelName");

-- CreateIndex
CREATE INDEX "PrivateRoom_ownerUserId_status_idx" ON "PrivateRoom"("ownerUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateRoomParticipant_roomId_userId_key" ON "PrivateRoomParticipant"("roomId", "userId");

-- CreateIndex
CREATE INDEX "PrivateRoomParticipant_userId_leftAt_idx" ON "PrivateRoomParticipant"("userId", "leftAt");

-- CreateIndex
CREATE INDEX "PrivateRoomParticipant_roomId_leftAt_idx" ON "PrivateRoomParticipant"("roomId", "leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateRoomInvite_roomId_invitedUserId_key" ON "PrivateRoomInvite"("roomId", "invitedUserId");

-- CreateIndex
CREATE INDEX "PrivateRoomInvite_invitedUserId_status_idx" ON "PrivateRoomInvite"("invitedUserId", "status");

-- CreateIndex
CREATE INDEX "PrivateRoomInvite_inviterUserId_idx" ON "PrivateRoomInvite"("inviterUserId");

-- AddForeignKey
ALTER TABLE "PrivateRoomParticipant" ADD CONSTRAINT "PrivateRoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PrivateRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateRoomInvite" ADD CONSTRAINT "PrivateRoomInvite_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "PrivateRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

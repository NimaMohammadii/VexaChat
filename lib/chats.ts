import { prisma } from "@/lib/prisma";

export const CHAT_LIFETIME_DAYS = 15;
const CHAT_LIFETIME_MS = CHAT_LIFETIME_DAYS * 24 * 60 * 60 * 1000;

export function canonicalConversationPair(userOneId: string, userTwoId: string) {
  return userOneId < userTwoId
    ? { userAId: userOneId, userBId: userTwoId }
    : { userAId: userTwoId, userBId: userOneId };
}

export async function areUsersFriends(currentUserId: string, otherUserId: string) {
  const link = await prisma.friendRequest.findFirst({
    where: {
      status: "accepted",
      OR: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    },
    select: { id: true }
  });

  return Boolean(link);
}

export async function areUsersBlocked(currentUserId: string, otherUserId: string) {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: currentUserId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: currentUserId }
      ]
    },
    select: { id: true }
  });

  return Boolean(block);
}

export function buildConversationExpiry(startedAt: Date) {
  return new Date(startedAt.getTime() + CHAT_LIFETIME_MS);
}

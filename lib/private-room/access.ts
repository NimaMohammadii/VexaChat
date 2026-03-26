import { prisma } from "@/lib/prisma";

export async function canAccessPrivateRoom(roomId: string, userId: string) {
  const room = await prisma.privateRoom.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      status: true,
      ownerUserId: true,
      invites: {
        where: {
          invitedUserId: userId,
          status: {
            in: ["pending", "accepted"]
          }
        },
        select: { id: true }
      },
      participants: {
        where: { userId },
        select: { id: true }
      }
    }
  });

  if (!room || room.status !== "active") {
    return { canAccess: false as const, room: null };
  }

  const canAccess = room.ownerUserId === userId || room.invites.length > 0 || room.participants.length > 0;

  return {
    canAccess,
    room
  };
}

export async function resolveUserDisplayMap(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, { username: string; avatarUrl: string }>();
  }

  const profiles = await prisma.userProfile.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, username: true, avatarUrl: true }
  });

  return new Map(profiles.map((item) => [item.userId, { username: item.username, avatarUrl: item.avatarUrl }]));
}

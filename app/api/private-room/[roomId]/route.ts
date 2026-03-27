import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessPrivateRoom, resolveUserDisplayMap } from "@/lib/private-room/access";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET(_request: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await canAccessPrivateRoom(params.roomId, user.id);

  if (!access.canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const room = await prisma.privateRoom.findUnique({
    where: { id: params.roomId },
    select: {
      id: true,
      roomCode: true,
      channelName: true,
      name: true,
      vibe: true,
      isPublic: true,
      enableTextChat: true,
      ownerUserId: true,
      createdAt: true,
      participants: {
        where: {
          leftAt: null
        },
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          userId: true,
          role: true,
          joinedAt: true
        }
      }
    }
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const userIds = Array.from(new Set(room.participants.map((participant) => participant.userId).concat(room.ownerUserId)));
  const profileMap = await resolveUserDisplayMap(userIds);

  return NextResponse.json({
    room: {
      ...room,
      participants: room.participants.map((participant) => ({
        ...participant,
        username: profileMap.get(participant.userId)?.username ?? "unknown",
        avatarUrl: profileMap.get(participant.userId)?.avatarUrl ?? ""
      }))
    },
    canAccess: true
  });
}

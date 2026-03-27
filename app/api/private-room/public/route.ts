import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserDisplayMap } from "@/lib/private-room/access";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rooms = await prisma.privateRoom.findMany({
    where: {
      status: "active",
      isPublic: true
    },
    orderBy: { updatedAt: "desc" },
    take: 24,
    select: {
      id: true,
      roomCode: true,
      name: true,
      vibe: true,
      ownerUserId: true,
      participants: {
        where: { leftAt: null },
        orderBy: { joinedAt: "asc" },
        select: { id: true, userId: true, role: true }
      }
    }
  });

  const userIds = Array.from(new Set(rooms.flatMap((room) => room.participants.map((participant) => participant.userId))));
  const profileMap = await resolveUserDisplayMap(userIds);

  return NextResponse.json({
    rooms: rooms.map((room) => ({
      id: room.id,
      roomCode: room.roomCode,
      name: room.name,
      vibe: room.vibe,
      type: "public" as const,
      ownerUserId: room.ownerUserId,
      participantCount: room.participants.length,
      participants: room.participants.slice(0, 4).map((participant) => ({
        id: participant.id,
        userId: participant.userId,
        role: participant.role,
        username: profileMap.get(participant.userId)?.username ?? "unknown",
        avatarUrl: profileMap.get(participant.userId)?.avatarUrl ?? ""
      }))
    }))
  });
}

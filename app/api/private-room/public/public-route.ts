import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { resolveUserDisplayMap } from "@/lib/private-room/access";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rooms = await prisma.privateRoom.findMany({
    where: {
      isPublic: true,
      status: "active"
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      description: true,
      roomCode: true,
      topics: true,
      enableVexa: true,
      coverUrl: true,
      createdAt: true,
      participants: {
        where: { leftAt: null },
        orderBy: { joinedAt: "asc" },
        take: 8,
        select: { userId: true }
      }
    }
  });

  const allUserIds = Array.from(
    new Set(rooms.flatMap((r) => r.participants.map((p) => p.userId)))
  );

  const profileMap = allUserIds.length
    ? await resolveUserDisplayMap(allUserIds)
    : new Map();

  const resolved = await Promise.all(
    rooms.map(async (room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      roomCode: room.roomCode,
      topics: room.topics,
      enableVexa: room.enableVexa,
      coverUrl: room.coverUrl ? await resolveStoredFileUrl(room.coverUrl).catch(() => "") : "",
      createdAt: room.createdAt,
      participants: room.participants.map((p) => ({
        username: profileMap.get(p.userId)?.username ?? "unknown",
        avatarUrl: profileMap.get(p.userId)?.avatarUrl ?? ""
      }))
    }))
  );

  return NextResponse.json({ rooms: resolved });
}

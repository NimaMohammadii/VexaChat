import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await prisma.privateRoomInvite.findMany({
    where: {
      invitedUserId: user.id,
      status: "pending",
      room: {
        status: "active"
      }
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      roomId: true,
      createdAt: true,
      room: {
        select: {
          name: true,
          roomCode: true,
          ownerUserId: true
        }
      }
    }
  });

  const ownerIds = Array.from(new Set(invites.map((invite) => invite.room.ownerUserId)));
  const owners = ownerIds.length
    ? await prisma.userProfile.findMany({
        where: { userId: { in: ownerIds } },
        select: { userId: true, username: true }
      })
    : [];
  const ownerMap = new Map(owners.map((owner) => [owner.userId, owner.username]));

  return NextResponse.json({
    invites: invites.map((invite) => ({
      id: invite.id,
      roomId: invite.roomId,
      roomName: invite.room.name,
      roomCode: invite.room.roomCode,
      ownerUserId: invite.room.ownerUserId,
      ownerUsername: ownerMap.get(invite.room.ownerUserId) ?? "unknown",
      createdAt: invite.createdAt
    }))
  });
}

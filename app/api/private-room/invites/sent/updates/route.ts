import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sinceParam = request.nextUrl.searchParams.get("since");
  const fallbackSince = new Date(Date.now() - 5 * 60 * 1000);
  const parsedSince = sinceParam ? new Date(sinceParam) : fallbackSince;
  const since = Number.isNaN(parsedSince.valueOf()) ? fallbackSince : parsedSince;

  const declinedInvites = await prisma.privateRoomInvite.findMany({
    where: {
      inviterUserId: user.id,
      status: "declined",
      updatedAt: {
        gt: since
      }
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
    select: {
      id: true,
      updatedAt: true,
      invitedUserId: true,
      room: {
        select: {
          id: true,
          name: true,
          roomCode: true
        }
      }
    }
  });

  const invitedIds = Array.from(new Set(declinedInvites.map((invite) => invite.invitedUserId)));
  const invitedUsers = invitedIds.length
    ? await prisma.userProfile.findMany({
        where: { userId: { in: invitedIds } },
        select: { userId: true, username: true }
      })
    : [];
  const invitedUserMap = new Map(invitedUsers.map((entry) => [entry.userId, entry.username]));

  return NextResponse.json({
    updates: declinedInvites.map((invite) => ({
      inviteId: invite.id,
      type: "declined",
      updatedAt: invite.updatedAt,
      roomId: invite.room.id,
      roomName: invite.room.name,
      roomCode: invite.room.roomCode,
      invitedUserId: invite.invitedUserId,
      invitedUsername: invitedUserMap.get(invite.invitedUserId) ?? "unknown"
    }))
  });
}

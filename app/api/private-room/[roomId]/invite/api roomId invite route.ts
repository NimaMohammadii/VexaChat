import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const room = await prisma.privateRoom.findUnique({
    where: { id: params.roomId },
    select: { id: true, ownerUserId: true, status: true }
  });

  if (!room || room.status !== "active") {
    return NextResponse.json({ error: "Room unavailable" }, { status: 404 });
  }

  if (room.ownerUserId !== user.id) {
    return NextResponse.json({ error: "Only room owner can invite" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => ({}))) as { invitedUserIds?: string[] };
  const invitedUserIds = Array.from(new Set((payload.invitedUserIds ?? []).filter((id) => id && id !== user.id)));

  if (invitedUserIds.length === 0) {
    return NextResponse.json({ error: "No invited users provided" }, { status: 400 });
  }

  await Promise.all(
    invitedUserIds.map(async (invitedUserId) => {
      await prisma.privateRoomInvite.upsert({
        where: {
          roomId_invitedUserId: {
            roomId: room.id,
            invitedUserId
          }
        },
        create: {
          roomId: room.id,
          invitedUserId,
          inviterUserId: user.id,
          status: "pending"
        },
        update: {
          inviterUserId: user.id,
          status: "pending"
        }
      });
    })
  );

  return NextResponse.json({ ok: true });
}

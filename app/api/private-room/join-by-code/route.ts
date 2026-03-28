import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Room code is required" }, { status: 400 });
  }

  const room = await prisma.privateRoom.findUnique({
    where: { roomCode: code },
    select: {
      id: true,
      status: true,
      isPublic: true,
      ownerUserId: true,
      roomCode: true,
    },
  });

  if (!room || room.status !== "active") {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const isOwner = room.ownerUserId === user.id;

  if (!isOwner && !room.isPublic) {
    const invite = await prisma.privateRoomInvite.findFirst({
      where: {
        roomId: room.id,
        invitedUserId: user.id,
        status: { in: ["pending", "accepted"] },
      },
      select: { id: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "This private room needs an invite" }, { status: 403 });
    }

    await prisma.privateRoomInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });
  }

  await prisma.privateRoomParticipant.upsert({
    where: {
      roomId_userId: {
        roomId: room.id,
        userId: user.id,
      },
    },
    create: {
      roomId: room.id,
      userId: user.id,
      role: isOwner ? "owner" : "participant",
      joinedAt: new Date(),
      leftAt: null,
    },
    update: {
      leftAt: null,
    },
  });

  return NextResponse.json({ room: { id: room.id, roomCode: room.roomCode } });
}

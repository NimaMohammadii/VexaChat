import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { buildChannelName, buildRoomCode } from "@/lib/private-room/utils";

async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const roomCode = buildRoomCode();
    const exists = await prisma.privateRoom.findUnique({ where: { roomCode }, select: { id: true } });

    if (!exists) {
      return roomCode;
    }
  }

  throw new Error("Unable to generate unique room code");
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser({ canSetCookies: true });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as {
      name?: string;
      enableTextChat?: boolean;
      invitedUserIds?: string[];
    };

    const invitedUserIds = Array.from(new Set((payload.invitedUserIds ?? []).filter((id) => id && id !== user.id)));
    const roomCode = await createUniqueRoomCode();
    const room = await prisma.privateRoom.create({
      data: {
        roomCode,
        channelName: buildChannelName(),
        ownerUserId: user.id,
        name: payload.name?.trim() || null,
        enableTextChat: Boolean(payload.enableTextChat),
        status: "active",
        participants: {
          create: {
            userId: user.id,
            role: "owner"
          }
        },
        invites: invitedUserIds.length
          ? {
              create: invitedUserIds.map((invitedUserId) => ({
                invitedUserId,
                inviterUserId: user.id,
                status: "pending"
              }))
            }
          : undefined
      },
      select: {
        id: true,
        roomCode: true,
        channelName: true,
        name: true,
        enableTextChat: true
      }
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Failed to create private room", error);
    return NextResponse.json({ error: "Unable to create private room" }, { status: 500 });
  }
}

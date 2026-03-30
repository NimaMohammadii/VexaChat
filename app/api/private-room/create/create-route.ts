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
      description?: string;
      coverUrl?: string;
      topics?: string[];
      enableTextChat?: boolean;
      enableVexa?: boolean;
      isPublic?: boolean;
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
        description: payload.description?.trim() ?? "",
        coverUrl: payload.coverUrl?.trim() ?? "",
        topics: (payload.topics ?? []).filter(Boolean),
        enableTextChat: payload.enableTextChat !== false,
        enableVexa: payload.enableVexa !== false,
        isPublic: Boolean(payload.isPublic),
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
        description: true,
        coverUrl: true,
        topics: true,
        enableTextChat: true,
        enableVexa: true,
        isPublic: true
      }
    });

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Failed to create private room", error);
    return NextResponse.json({ error: "Unable to create private room" }, { status: 500 });
  }
}

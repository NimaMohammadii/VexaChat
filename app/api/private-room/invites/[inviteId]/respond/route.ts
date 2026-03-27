import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: NextRequest, { params }: { params: { inviteId: string } }) {
  try {
    const user = await getAuthenticatedUser({ canSetCookies: true });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as { action?: "accept" | "reject" };

    if (!payload.action || !["accept", "reject"].includes(payload.action)) {
      return NextResponse.json({ error: "Action must be accept or reject" }, { status: 400 });
    }

    const invite = await prisma.privateRoomInvite.findFirst({
      where: {
        id: params.inviteId,
        invitedUserId: user.id
      },
      select: {
        id: true,
        roomId: true,
        status: true,
        room: {
          select: {
            id: true,
            status: true,
            name: true,
            roomCode: true,
            channelName: true,
            ownerUserId: true
          }
        }
      }
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: `Invite is already ${invite.status}` }, { status: 409 });
    }

    if (!invite.room || invite.room.status !== "active") {
      return NextResponse.json({ error: "Room unavailable" }, { status: 404 });
    }

    if (payload.action === "reject") {
      await prisma.privateRoomInvite.update({
        where: { id: invite.id },
        data: { status: "declined" }
      });

      return NextResponse.json({ ok: true, status: "declined" });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.privateRoomInvite.update({
        where: { id: invite.id },
        data: { status: "accepted" }
      });

      await tx.privateRoomParticipant.upsert({
        where: {
          roomId_userId: {
            roomId: invite.roomId,
            userId: user.id
          }
        },
        create: {
          roomId: invite.roomId,
          userId: user.id,
          role: "participant",
          joinedAt: new Date(),
          leftAt: null
        },
        update: {
          leftAt: null
        }
      });

      return invite.room;
    });

    return NextResponse.json({ ok: true, status: "accepted", room: result });
  } catch (error) {
    console.error("Failed to respond to private room invite", error);
    return NextResponse.json({ error: "Unable to respond to invite" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const participant = await prisma.privateRoomParticipant.findFirst({
    where: {
      userId: user.id,
      leftAt: null,
      room: {
        status: "active"
      }
    },
    orderBy: { joinedAt: "desc" },
    select: {
      roomId: true,
      room: {
        select: {
          id: true,
          roomCode: true,
          name: true,
          channelName: true,
          vibe: true,
          isPublic: true
        }
      }
    }
  });

  return NextResponse.json({ room: participant?.room ?? null });
}

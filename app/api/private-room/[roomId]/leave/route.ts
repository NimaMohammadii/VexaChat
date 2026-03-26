import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(_request: NextRequest, { params }: { params: { roomId: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.privateRoomParticipant.updateMany({
    where: {
      roomId: params.roomId,
      userId: user.id,
      leftAt: null
    },
    data: {
      leftAt: new Date()
    }
  });

  return NextResponse.json({ ok: true });
}

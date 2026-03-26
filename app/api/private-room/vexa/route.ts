import { NextRequest, NextResponse } from "next/server";
import { generateVexaResponse } from "@/lib/ai/vexa";
import { canAccessPrivateRoom } from "@/lib/private-room/access";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser({ canSetCookies: true });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as {
      roomId?: string;
      prompt?: string;
    };

    const roomId = payload.roomId?.trim();
    const prompt = payload.prompt?.trim();

    if (!roomId || !prompt) {
      return NextResponse.json({ error: "roomId and prompt are required" }, { status: 400 });
    }

    if (prompt.length > 1200) {
      return NextResponse.json({ error: "Prompt is too long. Keep it under 1200 characters." }, { status: 400 });
    }

    const access = await canAccessPrivateRoom(roomId, user.id);

    if (!access.canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const room = await prisma.privateRoom.findUnique({
      where: { id: roomId },
      select: {
        name: true,
        participants: {
          where: { leftAt: null },
          select: { id: true }
        }
      }
    });

    const vexa = await generateVexaResponse(prompt, {
      roomContext: {
        roomName: room?.name,
        participantCount: room?.participants.length ?? 0
      }
    });

    if (vexa.providerError) {
      console.error("Vexa provider issue", {
        roomId,
        userId: user.id,
        providerError: vexa.providerError
      });
    }

    return NextResponse.json({
      response: vexa.response,
      fallback: Boolean(vexa.providerError)
    });
  } catch (error) {
    console.error("Failed to generate Vexa response", error);
    return NextResponse.json({ error: "Unable to get Vexa response right now." }, { status: 500 });
  }
}

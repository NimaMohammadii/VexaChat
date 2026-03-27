import { NextRequest, NextResponse } from "next/server";
import { canAccessPrivateRoom } from "@/lib/private-room/access";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

const VEXA_REALTIME_INSTRUCTIONS =
  "You are Vexa, a live AI companion inside a private voice room. Respond naturally for speech-to-speech conversation. Keep responses concise, social, and easy to listen to, usually 1 to 3 short sentences unless asked for more.";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser({ canSetCookies: true });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = request.nextUrl.searchParams.get("roomId")?.trim();
    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    const access = await canAccessPrivateRoom(roomId, user.id);
    if (!access.canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const room = await prisma.privateRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        name: true,
        participants: {
          where: { leftAt: null },
          select: { id: true }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const offerSdp = (await request.text()).trim();
    if (!offerSdp) {
      return NextResponse.json({ error: "SDP offer is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const session = {
      type: "realtime",
      model: "gpt-realtime",
      instructions: `${VEXA_REALTIME_INSTRUCTIONS}\nRoom: ${room.name || "Private room"}. Members live now: ${room.participants.length}.`,
      audio: {
        input: {
          turn_detection: null,
          noise_reduction: { type: "near_field" }
        },
        output: {
          voice: "marin"
        }
      }
    };

    const formData = new FormData();
    formData.set("sdp", offerSdp);
    formData.set("session", JSON.stringify(session));

    const realtimeResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    const answerSdp = await realtimeResponse.text();

    if (!realtimeResponse.ok) {
      console.error("Failed to create Vexa realtime session", {
        userId: user.id,
        roomId,
        status: realtimeResponse.status,
        body: answerSdp.slice(0, 300)
      });

      return NextResponse.json({ error: "Failed to start realtime voice session." }, { status: 502 });
    }

    return new NextResponse(answerSdp, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp"
      }
    });
  } catch (error) {
    console.error("Unexpected Vexa realtime setup failure", error);
    return NextResponse.json({ error: "Unable to start realtime voice right now." }, { status: 500 });
  }
}

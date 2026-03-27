import { NextRequest, NextResponse } from "next/server";
import { canAccessPrivateRoom } from "@/lib/private-room/access";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

const VEXA_REALTIME_INSTRUCTIONS =
  "You are Vexa, a live AI companion inside a private voice room. Respond naturally for speech-to-speech conversation. Keep responses concise, social, and easy to listen to, usually 1 to 3 short sentences unless asked for more.";
const REALTIME_MODEL = "gpt-realtime";
const REALTIME_DEFAULT_VOICE = "marin";

type RealtimeFailureCode =
  | "backend_invalid_request"
  | "backend_room_access"
  | "backend_config"
  | "openai_session_creation_failed"
  | "openai_invalid_sdp_answer"
  | "backend_unexpected";

function fail(status: number, code: RealtimeFailureCode, message: string, stage: string, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: message,
      code,
      stage,
      ...details
    },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser({ canSetCookies: true });

    if (!user) {
      return fail(401, "backend_room_access", "Unauthorized", "auth");
    }

    const roomId = request.nextUrl.searchParams.get("roomId")?.trim();
    if (!roomId) {
      return fail(400, "backend_invalid_request", "roomId is required", "validate_request");
    }

    const access = await canAccessPrivateRoom(roomId, user.id);
    if (!access.canAccess) {
      return fail(403, "backend_room_access", "Forbidden", "room_access");
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
      return fail(404, "backend_room_access", "Room not found", "room_lookup");
    }

    const offerSdp = (await request.text()).trim();
    if (!offerSdp) {
      return fail(400, "backend_invalid_request", "SDP offer is required", "validate_offer");
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return fail(500, "backend_config", "OPENAI_API_KEY is not configured", "load_config");
    }

    const voice = process.env.OPENAI_REALTIME_VOICE?.trim() || REALTIME_DEFAULT_VOICE;
    const session = {
      type: "realtime",
      model: REALTIME_MODEL,
      instructions: `${VEXA_REALTIME_INSTRUCTIONS}\nRoom: ${room.name || "Private room"}. Members live now: ${room.participants.length}.`,
      audio: {
        output: {
          voice
        }
      }
    };

    const formData = new FormData();
    formData.set("sdp", new Blob([offerSdp], { type: "application/sdp" }), "offer.sdp");
    formData.set("session", new Blob([JSON.stringify(session)], { type: "application/json" }), "session.json");

    console.info("Vexa realtime setup: creating OpenAI session", {
      stage: "openai_session_create",
      userId: user.id,
      roomId,
      roomParticipantCount: room.participants.length,
      model: REALTIME_MODEL,
      voice,
      offerSdpLength: offerSdp.length,
      userAgent: request.headers.get("user-agent")?.slice(0, 120) ?? null
    });

    const realtimeResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    const answerSdp = await realtimeResponse.text();

    if (!realtimeResponse.ok) {
      console.error("Vexa realtime setup failed at OpenAI session creation", {
        userId: user.id,
        roomId,
        stage: "openai_session_create",
        model: REALTIME_MODEL,
        voice,
        status: realtimeResponse.status,
        body: answerSdp.slice(0, 1000)
      });

      return fail(502, "openai_session_creation_failed", "Failed to create realtime session with OpenAI.", "openai_session_create", {
        openaiStatus: realtimeResponse.status
      });
    }

    if (!answerSdp || !answerSdp.includes("m=audio")) {
      console.error("Vexa realtime setup returned invalid SDP answer", {
        userId: user.id,
        roomId,
        stage: "openai_sdp_parse",
        model: REALTIME_MODEL,
        voice,
        answerPreview: answerSdp.slice(0, 240)
      });
      return fail(502, "openai_invalid_sdp_answer", "Realtime setup returned an invalid SDP answer.", "openai_sdp_parse");
    }

    console.info("Vexa realtime setup succeeded", {
      stage: "complete",
      userId: user.id,
      roomId,
      model: REALTIME_MODEL,
      voice
    });

    return new NextResponse(answerSdp, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp"
      }
    });
  } catch (error) {
    console.error("Unexpected Vexa realtime setup failure", {
      stage: "unexpected",
      error: error instanceof Error ? error.message : String(error)
    });
    return fail(500, "backend_unexpected", "Unable to start realtime voice right now.", "unexpected");
  }
}

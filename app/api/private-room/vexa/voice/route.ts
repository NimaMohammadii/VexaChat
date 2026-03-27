import { NextRequest, NextResponse } from "next/server";
import { synthesizeVexaSpeech } from "@/lib/ai/elevenlabs";
import { generateVexaResponse } from "@/lib/ai/vexa";
import { canAccessPrivateRoom } from "@/lib/private-room/access";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

async function transcribeAudioFile(audio: File) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      transcript: "",
      providerError: "OPENAI_API_KEY missing",
      model: null,
      latencyMs: 0
    };
  }

  const model = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";
  const start = Date.now();

  const form = new FormData();
  form.append("model", model);
  form.append("file", audio, audio.name || "voice.webm");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 24000);

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: form,
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        transcript: "",
        providerError: `OpenAI transcription failed (${response.status}): ${errorText.slice(0, 220)}`,
        model,
        latencyMs: Date.now() - start
      };
    }

    const data = (await response.json()) as { text?: string };
    return {
      transcript: (data.text || "").trim(),
      providerError: null,
      model,
      latencyMs: Date.now() - start
    };
  } catch (error) {
    return {
      transcript: "",
      providerError: error instanceof Error ? error.message : "Unknown OpenAI transcription error",
      model,
      latencyMs: Date.now() - start
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser({ canSetCookies: true });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const roomId = `${formData.get("roomId") || ""}`.trim();
    const audioInput = formData.get("audio");

    if (!roomId || !(audioInput instanceof File)) {
      return NextResponse.json({ error: "roomId and audio are required" }, { status: 400 });
    }

    if (audioInput.size < 2_500) {
      return NextResponse.json({ error: "Recording is too short. Hold and speak a little longer." }, { status: 400 });
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

    const transcriptResult = await transcribeAudioFile(audioInput);

    if (transcriptResult.providerError) {
      console.error("Vexa transcription failed", {
        roomId,
        userId: user.id,
        providerError: transcriptResult.providerError
      });

      return NextResponse.json({ error: "Could not transcribe your voice right now." }, { status: 502 });
    }

    if (!transcriptResult.transcript || transcriptResult.transcript.length < 2) {
      return NextResponse.json({ error: "I couldn't catch that. Try holding and speaking a bit louder." }, { status: 400 });
    }

    const vexa = await generateVexaResponse(transcriptResult.transcript, {
      roomContext: {
        roomName: room.name,
        participantCount: room.participants.length
      }
    });

    if (vexa.providerError) {
      console.error("Vexa response provider issue", {
        roomId,
        userId: user.id,
        providerError: vexa.providerError
      });
    }

    const ttsResult = await synthesizeVexaSpeech(vexa.response);

    if (ttsResult.providerError) {
      console.error("Vexa tts provider issue", {
        roomId,
        userId: user.id,
        providerError: ttsResult.providerError
      });
    }

    return NextResponse.json({
      transcript: transcriptResult.transcript,
      response: vexa.response,
      audioBase64: ttsResult.audioBuffer ? ttsResult.audioBuffer.toString("base64") : null,
      audioMimeType: ttsResult.mimeType,
      playback: {
        scope: "local",
        readyForRoomInjection: true
      },
      model: {
        transcribe: transcriptResult.model,
        chat: vexa.model,
        tts: ttsResult.modelId,
        voiceId: ttsResult.voiceId
      },
      latencyMs: {
        transcribe: transcriptResult.latencyMs,
        chat: vexa.latencyMs,
        tts: ttsResult.latencyMs
      },
      warnings: {
        chatFallback: Boolean(vexa.providerError),
        ttsFallback: Boolean(ttsResult.providerError)
      }
    });
  } catch (error) {
    console.error("Failed voice Vexa interaction", error);
    return NextResponse.json({ error: "Unable to process voice right now." }, { status: 500 });
  }
}

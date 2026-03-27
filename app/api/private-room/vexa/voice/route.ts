import { NextRequest, NextResponse } from "next/server";
import { synthesizeVexaSpeech } from "@/lib/ai/elevenlabs";
import { generateVexaResponse } from "@/lib/ai/vexa";
import { canAccessPrivateRoom } from "@/lib/private-room/access";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MIN_AUDIO_BYTES = 2_500;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const DEFAULT_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/aac",
  "audio/m4a"
]);

type VoiceErrorCode =
  | "RECORDING_TOO_SHORT"
  | "AUDIO_TOO_LARGE"
  | "UNSUPPORTED_AUDIO_FORMAT"
  | "TRANSCRIPTION_TIMEOUT"
  | "OPENAI_CONFIG"
  | "OPENAI_AUTH"
  | "PROVIDER_UNAVAILABLE"
  | "NETWORK"
  | "TRANSCRIPTION_FAILED"
  | "INTERNAL_ERROR";

type VoiceFailure = {
  code: VoiceErrorCode;
  message: string;
  status: number;
  stage?: "transcription" | "chat" | "tts" | "request";
  debug?: Record<string, unknown>;
};

type TranscriptionResult = {
  transcript: string;
  providerError: string | null;
  model: string | null;
  latencyMs: number;
  attempts: number;
  providerStatus: number | null;
  providerBodySnippet: string | null;
  timeout: boolean;
  errorCode: VoiceErrorCode | null;
};

function devDebugMeta(stage: VoiceFailure["stage"], debug: Record<string, unknown> | undefined) {
  return process.env.NODE_ENV === "development" ? { stage, ...(debug || {}) } : undefined;
}

function createVoiceFailure(failure: VoiceFailure) {
  return NextResponse.json(
    {
      error: failure.message,
      code: failure.code,
      ...(failure.stage ? { stage: failure.stage } : {}),
      ...(process.env.NODE_ENV === "development" && failure.debug ? { debug: failure.debug } : {})
    },
    { status: failure.status }
  );
}

function isSupportedAudioMimeType(mimeType: string) {
  if (!mimeType) return false;
  const normalized = mimeType.toLowerCase();
  if (ALLOWED_AUDIO_MIME_TYPES.has(normalized)) return true;
  return normalized.startsWith("audio/webm") || normalized.startsWith("audio/ogg") || normalized.startsWith("audio/mp4");
}

async function transcribeAudioFile(audio: File): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      transcript: "",
      providerError: "OPENAI_API_KEY missing",
      model: null,
      latencyMs: 0,
      attempts: 0,
      providerStatus: null,
      providerBodySnippet: null,
      timeout: false,
      errorCode: "OPENAI_CONFIG" as const
    };
  }

  const model = process.env.OPENAI_TRANSCRIBE_MODEL || DEFAULT_TRANSCRIBE_MODEL;
  const start = Date.now();
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28_000);

    try {
      const form = new FormData();
      form.append("model", model);
      form.append("file", audio, audio.name || "voice.webm");

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
        const providerBodySnippet = errorText.slice(0, 350);
        const transient = response.status === 429 || response.status >= 500;
        if (transient && attempt < maxAttempts) {
          continue;
        }

        const errorCode: VoiceErrorCode =
          response.status === 401 || response.status === 403
            ? "OPENAI_AUTH"
            : response.status === 429 || response.status >= 500
              ? "PROVIDER_UNAVAILABLE"
              : "TRANSCRIPTION_FAILED";

        return {
          transcript: "",
          providerError: `OpenAI transcription failed (${response.status})`,
          model,
          latencyMs: Date.now() - start,
          attempts: attempt,
          providerStatus: response.status,
          providerBodySnippet,
          timeout: false,
          errorCode
        };
      }

      const data = (await response.json()) as { text?: string };
      return {
        transcript: (data.text || "").trim(),
        providerError: null,
        model,
        latencyMs: Date.now() - start,
        attempts: attempt,
        providerStatus: response.status,
        providerBodySnippet: null,
        timeout: false,
        errorCode: null
      };
    } catch (error) {
      const isTimeout =
        controller.signal.aborted ||
        (error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof Error && error.name === "AbortError");
      const transientNetwork =
        isTimeout ||
        (error instanceof TypeError && (error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("fetch")));

      if (transientNetwork && attempt < maxAttempts) {
        continue;
      }

      return {
        transcript: "",
        providerError: error instanceof Error ? error.message : "Unknown OpenAI transcription error",
        model,
        latencyMs: Date.now() - start,
        attempts: attempt,
        providerStatus: null,
        providerBodySnippet: null,
        timeout: isTimeout,
        errorCode: isTimeout ? "TRANSCRIPTION_TIMEOUT" : transientNetwork ? "NETWORK" : "TRANSCRIPTION_FAILED"
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    transcript: "",
    providerError: "Transcription retry exhausted",
    model,
    latencyMs: Date.now() - start,
    attempts: maxAttempts,
    providerStatus: null,
    providerBodySnippet: null,
    timeout: false,
    errorCode: "PROVIDER_UNAVAILABLE" as const
  };
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

    const audioMimeType = audioInput.type || "application/octet-stream";
    const audioSize = audioInput.size;

    if (!isSupportedAudioMimeType(audioMimeType)) {
      return createVoiceFailure({
        code: "UNSUPPORTED_AUDIO_FORMAT",
        message: "Unsupported audio format. Please try again from the latest browser version.",
        status: 415,
        stage: "request",
        debug: devDebugMeta("request", { mimeType: audioMimeType, bytes: audioSize })
      });
    }

    if (audioSize < MIN_AUDIO_BYTES) {
      return createVoiceFailure({
        code: "RECORDING_TOO_SHORT",
        message: "Recording is too short. Hold and speak a little longer.",
        status: 400,
        stage: "request",
        debug: devDebugMeta("request", { bytes: audioSize, minBytes: MIN_AUDIO_BYTES })
      });
    }

    if (audioSize > MAX_AUDIO_BYTES) {
      return createVoiceFailure({
        code: "AUDIO_TOO_LARGE",
        message: "Recording is too large. Please keep it shorter and retry.",
        status: 413,
        stage: "request",
        debug: devDebugMeta("request", { bytes: audioSize, maxBytes: MAX_AUDIO_BYTES })
      });
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
        audioSizeBytes: audioSize,
        audioMimeType,
        transcribeModel: transcriptResult.model,
        providerError: transcriptResult.providerError,
        providerStatus: transcriptResult.providerStatus,
        providerBodySnippet: transcriptResult.providerBodySnippet,
        timeout: transcriptResult.timeout,
        attempts: transcriptResult.attempts
      });

      const code: VoiceErrorCode = transcriptResult.errorCode || "TRANSCRIPTION_FAILED";
      const messageMap: Record<VoiceErrorCode, string> = {
        RECORDING_TOO_SHORT: "Recording is too short. Hold and speak a little longer.",
        AUDIO_TOO_LARGE: "Recording is too large. Please keep it shorter and retry.",
        UNSUPPORTED_AUDIO_FORMAT: "Unsupported audio format. Try using a different browser.",
        TRANSCRIPTION_TIMEOUT: "Transcription timed out. Please try again.",
        OPENAI_CONFIG: "Voice transcription is not configured on this server.",
        OPENAI_AUTH: "Voice transcription authentication failed. Please contact support.",
        PROVIDER_UNAVAILABLE: "Transcription service is temporarily unavailable. Please retry in a moment.",
        NETWORK: "Network error while transcribing audio. Please check your connection and retry.",
        TRANSCRIPTION_FAILED: "Could not transcribe your voice right now.",
        INTERNAL_ERROR: "Unable to process voice right now."
      };

      const statusMap: Record<VoiceErrorCode, number> = {
        RECORDING_TOO_SHORT: 400,
        AUDIO_TOO_LARGE: 413,
        UNSUPPORTED_AUDIO_FORMAT: 415,
        TRANSCRIPTION_TIMEOUT: 504,
        OPENAI_CONFIG: 500,
        OPENAI_AUTH: 502,
        PROVIDER_UNAVAILABLE: 503,
        NETWORK: 503,
        TRANSCRIPTION_FAILED: 502,
        INTERNAL_ERROR: 500
      };

      return createVoiceFailure({
        code,
        message: messageMap[code],
        status: statusMap[code],
        stage: "transcription",
        debug: devDebugMeta("transcription", {
          providerStatus: transcriptResult.providerStatus,
          timeout: transcriptResult.timeout,
          attempts: transcriptResult.attempts,
          transcribeModel: transcriptResult.model,
          mimeType: audioMimeType,
          bytes: audioSize
        })
      });
    }

    if (!transcriptResult.transcript || transcriptResult.transcript.length < 2) {
      return createVoiceFailure({
        code: "RECORDING_TOO_SHORT",
        message: "I couldn't catch that. Try holding and speaking a bit louder.",
        status: 400,
        stage: "transcription",
        debug: devDebugMeta("transcription", { transcriptLength: transcriptResult.transcript.length })
      });
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
    return createVoiceFailure({
      code: "INTERNAL_ERROR",
      message: "Unable to process voice right now.",
      status: 500,
      stage: "request"
    });
  }
}

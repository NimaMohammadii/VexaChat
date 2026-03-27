import { NextRequest, NextResponse } from "next/server";
import { canAccessPrivateRoom } from "@/lib/private-room/access";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

const VEXA_REALTIME_INSTRUCTIONS =
  "You are Vexa, a live AI companion inside a private voice room. Respond naturally for speech-to-speech conversation. Keep responses concise, social, and easy to listen to, usually 1 to 3 short sentences unless asked for more.";
const DEFAULT_REALTIME_MODEL = "gpt-realtime";
const DEFAULT_REALTIME_VOICE = "marin";
const SUPPORTED_REALTIME_VOICES = new Set(["alloy", "ash", "ballad", "cedar", "coral", "echo", "marin", "sage", "shimmer", "verse"]);

type RealtimeFailureCode =
  | "backend_invalid_request"
  | "backend_room_access"
  | "backend_config"
  | "openai_session_creation_failed"
  | "openai_invalid_sdp_answer"
  | "backend_unexpected";

type OpenAiRealtimeAttempt = {
  model: string;
  voice: string;
  reason: "primary" | "fallback";
};

type OpenAiRealtimeFailure = {
  status: number;
  body: string;
  requestId: string | null;
  contentType: string | null;
};

type ParsedInboundOffer = {
  sdp: string;
  contentType: string;
  source: "raw_text" | "json" | "form_data";
};

function createSdpPreview(sdp: string, edgeLength = 80) {
  const compact = sdp.replace(/\r?\n/g, "\\n");
  if (compact.length <= edgeLength * 2) {
    return compact;
  }
  return `${compact.slice(0, edgeLength)}…${compact.slice(-edgeLength)}`;
}

function validateInboundOfferSdp(offerSdp: string) {
  const normalized = offerSdp.replace(/\r\n/g, "\n");
  const trimmed = normalized.trim();

  const diagnostics = {
    offerSdpLength: offerSdp.length,
    trimmedLength: trimmed.length,
    startsWithV0: trimmed.startsWith("v=0"),
    hasAudioSection: trimmed.includes("\nm=audio")
  };

  if (!trimmed) {
    return {
      ok: false as const,
      reason: "SDP offer is required",
      diagnostics
    };
  }

  if (!trimmed.startsWith("v=0")) {
    return {
      ok: false as const,
      reason: "SDP offer is malformed (missing v=0)",
      diagnostics
    };
  }

  if (!trimmed.includes("\nm=audio")) {
    return {
      ok: false as const,
      reason: "SDP offer is malformed (missing audio media section)",
      diagnostics
    };
  }

  if (trimmed.length < 120) {
    return {
      ok: false as const,
      reason: "SDP offer appears truncated",
      diagnostics
    };
  }

  return {
    ok: true as const,
    offerSdp: trimmed,
    diagnostics
  };
}

async function parseInboundOfferSdp(request: NextRequest): Promise<ParsedInboundOffer> {
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json().catch(() => ({}))) as { sdp?: unknown; offerSdp?: unknown };
    const sdpCandidate = typeof payload.sdp === "string" ? payload.sdp : typeof payload.offerSdp === "string" ? payload.offerSdp : "";
    return { sdp: sdpCandidate, contentType, source: "json" };
  }

  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const sdpValue = form.get("sdp");
    const offerSdpValue = form.get("offerSdp");
    const sdpCandidate =
      typeof sdpValue === "string" ? sdpValue : typeof offerSdpValue === "string" ? offerSdpValue : "";
    return { sdp: sdpCandidate, contentType, source: "form_data" };
  }

  return {
    sdp: await request.text(),
    contentType,
    source: "raw_text"
  };
}

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

function readEnvTrimmed(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return null;
}

async function createOpenAiRealtimeCall(apiKey: string, offerSdp: string, roomContext: string, attempt: OpenAiRealtimeAttempt) {
  const session = {
    type: "realtime",
    model: attempt.model,
    instructions: `${VEXA_REALTIME_INSTRUCTIONS}\n${roomContext}`,
    audio: {
      output: {
        voice: attempt.voice
      }
    }
  };

  const sessionJson = JSON.stringify(session);
  const formData = new FormData();
  // OpenAI's /v1/realtime/calls multipart parser expects `sdp` as a text field.
  // Sending it as a file/blob part can cause `field "sdp" is required` errors.
  formData.set("sdp", offerSdp);
  formData.set("session", sessionJson);

  const outboundSdpValue = formData.get("sdp");
  const outboundSdpLength = typeof outboundSdpValue === "string" ? outboundSdpValue.length : null;
  const formDataHasSdp = formData.has("sdp");

  console.info("Vexa realtime setup: forwarding offer to OpenAI", {
    stage: "openai_session_create",
    model: attempt.model,
    voice: attempt.voice,
    attempt: attempt.reason,
    offerSdpLength: offerSdp.length,
    outboundSdpLength,
    formDataHasSdp,
    sessionJsonLength: sessionJson.length,
    payloadStrategy: "multipart_form_data_text_fields"
  });

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  const body = await response.text();
  const requestId = response.headers.get("x-request-id");
  const contentType = response.headers.get("content-type");

  if (!response.ok) {
    const failure: OpenAiRealtimeFailure = {
      status: response.status,
      body,
      requestId,
      contentType
    };

    console.error("Vexa realtime setup: raw OpenAI error response", {
      stage: "openai_session_create",
      model: attempt.model,
      voice: attempt.voice,
      attempt: attempt.reason,
      status: response.status,
      requestId,
      contentType,
      rawBody: body
    });

    return { ok: false as const, failure };
  }

  return {
    ok: true as const,
    answerSdp: body,
    requestId
  };
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

    const inboundOffer = await parseInboundOfferSdp(request);
    const offerValidation = validateInboundOfferSdp(inboundOffer.sdp);

    console.info("Vexa realtime setup: inbound SDP diagnostics", {
      stage: "validate_offer",
      userId: user.id,
      roomId,
      contentType: inboundOffer.contentType || null,
      source: inboundOffer.source,
      ...offerValidation.diagnostics,
      offerPreview: inboundOffer.sdp ? createSdpPreview(inboundOffer.sdp) : null
    });

    if (!offerValidation.ok) {
      return fail(400, "backend_invalid_request", offerValidation.reason, "validate_offer");
    }

    const offerSdp = offerValidation.offerSdp;

    const apiKey = readEnvTrimmed("OPENAI_API_KEY");
    if (!apiKey) {
      return fail(500, "backend_config", "OPENAI_API_KEY is not configured", "load_config");
    }

    const configuredModel = readEnvTrimmed("OPENAI_REALTIME_MODEL", "OPENAI_VEXA_REALTIME_MODEL") || DEFAULT_REALTIME_MODEL;
    const configuredVoiceRaw =
      readEnvTrimmed("OPENAI_REALTIME_VOICE", "OPENAI_VEXA_REALTIME_VOICE") || DEFAULT_REALTIME_VOICE;
    const configuredVoice = configuredVoiceRaw.toLowerCase();

    const primaryAttempt: OpenAiRealtimeAttempt = {
      model: configuredModel,
      voice: configuredVoice,
      reason: "primary"
    };

    const fallbackAttempt: OpenAiRealtimeAttempt = {
      model: DEFAULT_REALTIME_MODEL,
      voice: DEFAULT_REALTIME_VOICE,
      reason: "fallback"
    };

    const shouldTryFallback =
      primaryAttempt.model !== fallbackAttempt.model || primaryAttempt.voice !== fallbackAttempt.voice;

    if (!SUPPORTED_REALTIME_VOICES.has(primaryAttempt.voice)) {
      console.warn("Vexa realtime setup: configured voice is not in known supported voice set", {
        roomId,
        userId: user.id,
        configuredVoice: primaryAttempt.voice,
        fallbackVoice: fallbackAttempt.voice
      });
    }

    const roomContext = `Room: ${room.name || "Private room"}. Members live now: ${room.participants.length}.`;

    console.info("Vexa realtime setup: creating OpenAI session", {
      stage: "openai_session_create",
      userId: user.id,
      roomId,
      roomParticipantCount: room.participants.length,
      configuredModel: primaryAttempt.model,
      configuredVoice: primaryAttempt.voice,
      offerSdpLength: offerSdp.length,
      offerSdpStartsWithV0: offerSdp.startsWith("v=0"),
      offerPreview: createSdpPreview(offerSdp),
      userAgent: request.headers.get("user-agent")?.slice(0, 120) ?? null
    });

    const attempts = [primaryAttempt, ...(shouldTryFallback ? [fallbackAttempt] : [])];
    let openAiFailure: OpenAiRealtimeFailure | null = null;

    for (const attempt of attempts) {
      const realtimeResult = await createOpenAiRealtimeCall(apiKey, offerSdp, roomContext, attempt);

      if (realtimeResult.ok) {
        const answerSdp = realtimeResult.answerSdp;

        if (!answerSdp || !answerSdp.includes("m=audio")) {
          console.error("Vexa realtime setup returned invalid SDP answer", {
            userId: user.id,
            roomId,
            stage: "openai_sdp_parse",
            model: attempt.model,
            voice: attempt.voice,
            attempt: attempt.reason,
            openAiRequestId: realtimeResult.requestId,
            answerPreview: answerSdp.slice(0, 240)
          });
          return fail(502, "openai_invalid_sdp_answer", "Realtime setup returned an invalid SDP answer.", "openai_sdp_parse");
        }

        console.info("Vexa realtime setup succeeded", {
          stage: "complete",
          userId: user.id,
          roomId,
          model: attempt.model,
          voice: attempt.voice,
          attempt: attempt.reason,
          openAiRequestId: realtimeResult.requestId
        });

        return new NextResponse(answerSdp, {
          status: 200,
          headers: {
            "Content-Type": "application/sdp"
          }
        });
      }

      openAiFailure = realtimeResult.failure;

      console.error("Vexa realtime setup failed at OpenAI session creation", {
        userId: user.id,
        roomId,
        stage: "openai_session_create",
        model: attempt.model,
        voice: attempt.voice,
        attempt: attempt.reason,
        status: realtimeResult.failure.status,
        requestId: realtimeResult.failure.requestId,
        contentType: realtimeResult.failure.contentType,
        body: realtimeResult.failure.body.slice(0, 1500)
      });

      if (!(realtimeResult.failure.status === 400 && attempt.reason === "primary" && shouldTryFallback)) {
        break;
      }

      console.warn("Vexa realtime setup: retrying OpenAI call using default model/voice fallback", {
        userId: user.id,
        roomId,
        fallbackModel: fallbackAttempt.model,
        fallbackVoice: fallbackAttempt.voice,
        previousStatus: realtimeResult.failure.status,
        previousRequestId: realtimeResult.failure.requestId
      });
    }

    return fail(502, "openai_session_creation_failed", "Failed to create realtime session with OpenAI.", "openai_session_create", {
      openaiStatus: openAiFailure?.status ?? null,
      openaiRequestId: openAiFailure?.requestId ?? null,
      openaiError: openAiFailure?.body?.slice(0, 600) ?? null,
      attemptedModel: configuredModel,
      attemptedVoice: configuredVoice
    });
  } catch (error) {
    console.error("Unexpected Vexa realtime setup failure", {
      stage: "unexpected",
      error: error instanceof Error ? error.message : String(error)
    });
    return fail(500, "backend_unexpected", "Unable to start realtime voice right now.", "unexpected");
  }
}

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const ELEVENLABS_VOICE_ID = "7piC4m7q8WrpEAnMj5xC";
const ELEVENLABS_PRIMARY_MODEL_ID = "eleven_v3";
const ELEVENLABS_FALLBACK_MODEL_ID = "eleven_multilingual_v2";
const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128";
const ELEVENLABS_TIMEOUT_MS = 18_000;

type TtsErrorCode =
  | "TTS_CONFIG"
  | "TTS_AUTH"
  | "TTS_INVALID_VOICE"
  | "TTS_INVALID_MODEL"
  | "TTS_INVALID_OUTPUT_FORMAT"
  | "TTS_UNSUPPORTED_REQUEST"
  | "TTS_TIMEOUT"
  | "TTS_NETWORK"
  | "TTS_EMPTY_AUDIO"
  | "TTS_BAD_CONTENT_TYPE"
  | "TTS_PROVIDER_UNAVAILABLE"
  | "TTS_FAILED";

type ElevenLabsAttemptResult = {
  ok: boolean;
  audioBuffer: Buffer | null;
  modelId: string;
  mimeType: string;
  providerStatus: number | null;
  providerBodySnippet: string | null;
  providerError: string | null;
  errorCode: TtsErrorCode | null;
  timeout: boolean;
  latencyMs: number;
};

export type ElevenLabsSpeechResult = {
  audioBuffer: Buffer | null;
  mimeType: string;
  voiceId: string;
  modelId: string;
  attemptedModelIds: string[];
  latencyMs: number;
  outputFormat: string;
  providerStatus: number | null;
  providerBodySnippet: string | null;
  providerContentType: string | null;
  errorCode: TtsErrorCode | null;
  providerError: string | null;
  timeout: boolean;
  fallbackUsed: boolean;
};

function cleanSnippet(raw: string, max = 350) {
  return raw.replace(/\s+/g, " ").trim().slice(0, max);
}

function mapTtsStatusToCode(status: number, bodySnippet: string): TtsErrorCode {
  const normalized = bodySnippet.toLowerCase();

  if (status === 401 || status === 403) return "TTS_AUTH";
  if (status === 404 || normalized.includes("voice") || normalized.includes("voice_id")) return "TTS_INVALID_VOICE";
  if (status === 408 || status === 504) return "TTS_TIMEOUT";
  if (status === 429 || status >= 500) return "TTS_PROVIDER_UNAVAILABLE";

  if (status === 422 || status === 400) {
    if (normalized.includes("model") || normalized.includes("model_id")) return "TTS_INVALID_MODEL";
    if (normalized.includes("output_format") || normalized.includes("output format") || normalized.includes("format")) {
      return "TTS_INVALID_OUTPUT_FORMAT";
    }
    return "TTS_UNSUPPORTED_REQUEST";
  }

  return "TTS_FAILED";
}

async function runTtsRequest(params: {
  apiKey: string;
  text: string;
  modelId: string;
  voiceId: string;
  outputFormat: string;
}): Promise<ElevenLabsAttemptResult> {
  const { apiKey, text, modelId, voiceId, outputFormat } = params;
  const start = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);

  try {
    const url = new URL(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`);
    url.searchParams.set("output_format", outputFormat);

    const response = await fetch(url.toString(), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/*",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text,
        model_id: modelId
      })
    });

    const responseMimeType = response.headers.get("content-type") || null;

    if (!response.ok) {
      const providerBodySnippet = cleanSnippet(await response.text());
      const errorCode = mapTtsStatusToCode(response.status, providerBodySnippet);
      return {
        ok: false,
        audioBuffer: null,
        modelId,
        mimeType: responseMimeType || "application/octet-stream",
        providerStatus: response.status,
        providerBodySnippet,
        providerError: `ElevenLabs request failed (${response.status})`,
        errorCode,
        timeout: false,
        latencyMs: Date.now() - start
      };
    }

    if (!responseMimeType?.toLowerCase().startsWith("audio/")) {
      const providerBodySnippet = cleanSnippet(await response.text());
      return {
        ok: false,
        audioBuffer: null,
        modelId,
        mimeType: responseMimeType || "application/octet-stream",
        providerStatus: response.status,
        providerBodySnippet,
        providerError: `Unexpected ElevenLabs content type: ${responseMimeType || "missing"}`,
        errorCode: "TTS_BAD_CONTENT_TYPE",
        timeout: false,
        latencyMs: Date.now() - start
      };
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    if (!audioBuffer.length) {
      return {
        ok: false,
        audioBuffer: null,
        modelId,
        mimeType: responseMimeType,
        providerStatus: response.status,
        providerBodySnippet: null,
        providerError: "ElevenLabs returned an empty audio buffer",
        errorCode: "TTS_EMPTY_AUDIO",
        timeout: false,
        latencyMs: Date.now() - start
      };
    }

    return {
      ok: true,
      audioBuffer,
      modelId,
      mimeType: responseMimeType,
      providerStatus: response.status,
      providerBodySnippet: null,
      providerError: null,
      errorCode: null,
      timeout: false,
      latencyMs: Date.now() - start
    };
  } catch (error) {
    const isTimeout =
      controller.signal.aborted ||
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError");

    return {
      ok: false,
      audioBuffer: null,
      modelId,
      mimeType: "application/octet-stream",
      providerStatus: null,
      providerBodySnippet: null,
      providerError: error instanceof Error ? error.message : "Unknown ElevenLabs error",
      errorCode: isTimeout ? "TTS_TIMEOUT" : "TTS_NETWORK",
      timeout: isTimeout,
      latencyMs: Date.now() - start
    };
  } finally {
    clearTimeout(timeout);
  }
}

function shouldTryFallback(errorCode: TtsErrorCode | null) {
  return errorCode === "TTS_INVALID_MODEL" || errorCode === "TTS_UNSUPPORTED_REQUEST";
}

export async function synthesizeVexaSpeech(text: string): Promise<ElevenLabsSpeechResult> {
  const apiKey = process.env.ELEVEN_API;
  const voiceId = ELEVENLABS_VOICE_ID;
  const outputFormat = ELEVENLABS_OUTPUT_FORMAT;
  const modelsToTry = [ELEVENLABS_PRIMARY_MODEL_ID, ELEVENLABS_FALLBACK_MODEL_ID];

  if (!apiKey) {
    return {
      audioBuffer: null,
      mimeType: "audio/mpeg",
      voiceId,
      modelId: ELEVENLABS_PRIMARY_MODEL_ID,
      attemptedModelIds: [ELEVENLABS_PRIMARY_MODEL_ID],
      latencyMs: 0,
      outputFormat,
      providerStatus: null,
      providerBodySnippet: null,
      providerContentType: null,
      errorCode: "TTS_CONFIG",
      providerError: "ELEVEN_API missing",
      timeout: false,
      fallbackUsed: false
    };
  }

  const cleanedText = text.trim().slice(0, 5_000);
  if (!cleanedText) {
    return {
      audioBuffer: null,
      mimeType: "audio/mpeg",
      voiceId,
      modelId: ELEVENLABS_PRIMARY_MODEL_ID,
      attemptedModelIds: [ELEVENLABS_PRIMARY_MODEL_ID],
      latencyMs: 0,
      outputFormat,
      providerStatus: null,
      providerBodySnippet: null,
      providerContentType: null,
      errorCode: "TTS_FAILED",
      providerError: "No text provided for TTS",
      timeout: false,
      fallbackUsed: false
    };
  }

  const attemptedModelIds: string[] = [];
  let lastFailure: ElevenLabsAttemptResult | null = null;

  for (const modelId of modelsToTry) {
    attemptedModelIds.push(modelId);
    const attempt = await runTtsRequest({ apiKey, text: cleanedText, modelId, voiceId, outputFormat });

    if (attempt.ok && attempt.audioBuffer) {
      return {
        audioBuffer: attempt.audioBuffer,
        mimeType: attempt.mimeType,
        voiceId,
        modelId,
        attemptedModelIds,
        latencyMs: attempt.latencyMs,
        outputFormat,
        providerStatus: attempt.providerStatus,
        providerBodySnippet: null,
        providerContentType: attempt.mimeType,
        errorCode: null,
        providerError: null,
        timeout: false,
        fallbackUsed: modelId !== ELEVENLABS_PRIMARY_MODEL_ID
      };
    }

    lastFailure = attempt;

    if (modelId === ELEVENLABS_PRIMARY_MODEL_ID && shouldTryFallback(attempt.errorCode)) {
      continue;
    }

    break;
  }

  return {
    audioBuffer: null,
    mimeType: lastFailure?.mimeType || "audio/mpeg",
    voiceId,
    modelId: lastFailure?.modelId || ELEVENLABS_PRIMARY_MODEL_ID,
    attemptedModelIds,
    latencyMs: lastFailure?.latencyMs || 0,
    outputFormat,
    providerStatus: lastFailure?.providerStatus || null,
    providerBodySnippet: lastFailure?.providerBodySnippet || null,
    providerContentType: lastFailure?.mimeType || null,
    errorCode: lastFailure?.errorCode || "TTS_FAILED",
    providerError: lastFailure?.providerError || "ElevenLabs request failed",
    timeout: Boolean(lastFailure?.timeout),
    fallbackUsed: false
  };
}

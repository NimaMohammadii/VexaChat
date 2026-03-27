const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";
const ELEVENLABS_VOICE_ID = "7piC4m7q8WrpEAnMj5xC";
const ELEVENLABS_MODEL_ID = "eleven_v3";
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

export type ElevenLabsSpeechResult = {
  audioBuffer: Buffer | null;
  mimeType: string;
  voiceId: string;
  modelId: string;
  latencyMs: number;
  outputFormat: string;
  providerStatus: number | null;
  providerBodySnippet: string | null;
  errorCode: TtsErrorCode | null;
  providerError: string | null;
  timeout: boolean;
};

function cleanSnippet(raw: string, max = 300) {
  return raw.replace(/\s+/g, " ").trim().slice(0, max);
}

function mapTtsStatusToCode(status: number, bodySnippet: string): TtsErrorCode {
  if (status === 401 || status === 403) return "TTS_AUTH";
  if (status === 404) return "TTS_INVALID_VOICE";
  if (status === 429 || status >= 500) return "TTS_PROVIDER_UNAVAILABLE";

  if (status === 422 || status === 400) {
    const normalized = bodySnippet.toLowerCase();
    if (normalized.includes("voice")) return "TTS_INVALID_VOICE";
    if (normalized.includes("model")) return "TTS_INVALID_MODEL";
    if (normalized.includes("output_format") || normalized.includes("output format") || normalized.includes("format")) {
      return "TTS_INVALID_OUTPUT_FORMAT";
    }
    return "TTS_UNSUPPORTED_REQUEST";
  }

  return "TTS_FAILED";
}

export async function synthesizeVexaSpeech(text: string): Promise<ElevenLabsSpeechResult> {
  const apiKey = process.env.ELEVEN_API;
  const start = Date.now();
  const mimeType = "audio/mpeg";

  if (!apiKey) {
    return {
      audioBuffer: null,
      mimeType,
      voiceId: ELEVENLABS_VOICE_ID,
      modelId: ELEVENLABS_MODEL_ID,
      latencyMs: 0,
      outputFormat: ELEVENLABS_OUTPUT_FORMAT,
      providerStatus: null,
      providerBodySnippet: null,
      errorCode: "TTS_CONFIG",
      providerError: "ELEVEN_API missing",
      timeout: false
    };
  }

  const cleanedText = text.trim().slice(0, 2200);
  if (!cleanedText) {
    return {
      audioBuffer: null,
      mimeType,
      voiceId: ELEVENLABS_VOICE_ID,
      modelId: ELEVENLABS_MODEL_ID,
      latencyMs: 0,
      outputFormat: ELEVENLABS_OUTPUT_FORMAT,
      providerStatus: null,
      providerBodySnippet: null,
      errorCode: "TTS_FAILED",
      providerError: "No text provided for TTS",
      timeout: false
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);

  try {
    const url = new URL(`${ELEVENLABS_BASE_URL}/text-to-speech/${ELEVENLABS_VOICE_ID}`);
    url.searchParams.set("output_format", ELEVENLABS_OUTPUT_FORMAT);

    const response = await fetch(url.toString(), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text: cleanedText,
        model_id: ELEVENLABS_MODEL_ID
      })
    });

    if (!response.ok) {
      const providerBodySnippet = cleanSnippet(await response.text());
      const errorCode = mapTtsStatusToCode(response.status, providerBodySnippet);
      return {
        audioBuffer: null,
        mimeType,
        voiceId: ELEVENLABS_VOICE_ID,
        modelId: ELEVENLABS_MODEL_ID,
        latencyMs: Date.now() - start,
        outputFormat: ELEVENLABS_OUTPUT_FORMAT,
        providerStatus: response.status,
        providerBodySnippet,
        errorCode,
        providerError: `ElevenLabs request failed (${response.status})`,
        timeout: false
      };
    }

    const responseMimeType = response.headers.get("content-type") || mimeType;
    if (!responseMimeType.toLowerCase().startsWith("audio/")) {
      const providerBodySnippet = cleanSnippet(await response.text());
      return {
        audioBuffer: null,
        mimeType: responseMimeType,
        voiceId: ELEVENLABS_VOICE_ID,
        modelId: ELEVENLABS_MODEL_ID,
        latencyMs: Date.now() - start,
        outputFormat: ELEVENLABS_OUTPUT_FORMAT,
        providerStatus: response.status,
        providerBodySnippet,
        errorCode: "TTS_BAD_CONTENT_TYPE",
        providerError: `Unexpected ElevenLabs content type: ${responseMimeType}`,
        timeout: false
      };
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    if (!audioBuffer.length) {
      return {
        audioBuffer: null,
        mimeType: responseMimeType,
        voiceId: ELEVENLABS_VOICE_ID,
        modelId: ELEVENLABS_MODEL_ID,
        latencyMs: Date.now() - start,
        outputFormat: ELEVENLABS_OUTPUT_FORMAT,
        providerStatus: response.status,
        providerBodySnippet: null,
        errorCode: "TTS_EMPTY_AUDIO",
        providerError: "ElevenLabs returned an empty audio buffer",
        timeout: false
      };
    }

    return {
      audioBuffer,
      mimeType: responseMimeType,
      voiceId: ELEVENLABS_VOICE_ID,
      modelId: ELEVENLABS_MODEL_ID,
      latencyMs: Date.now() - start,
      outputFormat: ELEVENLABS_OUTPUT_FORMAT,
      providerStatus: response.status,
      providerBodySnippet: null,
      errorCode: null,
      providerError: null,
      timeout: false
    };
  } catch (error) {
    const isTimeout =
      controller.signal.aborted ||
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError");

    return {
      audioBuffer: null,
      mimeType,
      voiceId: ELEVENLABS_VOICE_ID,
      modelId: ELEVENLABS_MODEL_ID,
      latencyMs: Date.now() - start,
      outputFormat: ELEVENLABS_OUTPUT_FORMAT,
      providerStatus: null,
      providerBodySnippet: null,
      errorCode: isTimeout ? "TTS_TIMEOUT" : "TTS_NETWORK",
      providerError: error instanceof Error ? error.message : "Unknown ElevenLabs error",
      timeout: isTimeout
    };
  } finally {
    clearTimeout(timeout);
  }
}

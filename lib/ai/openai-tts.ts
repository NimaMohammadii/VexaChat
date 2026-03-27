const OPENAI_TTS_ENDPOINT = "https://api.openai.com/v1/audio/speech";
const OPENAI_TTS_MODEL = "gpt-4o-mini-tts";
const OPENAI_TTS_VOICE = "alloy";
const OPENAI_TTS_TIMEOUT_MS = 18_000;

export type OpenAiTtsResult = {
  audioBase64: string | null;
  mimeType: "audio/mpeg";
  model: string;
  voice: string;
  latencyMs: number;
  providerStatus: number | null;
  providerError: string | null;
  providerBodySnippet: string | null;
  timeout: boolean;
  warningCode: "OPENAI_TTS_FAILED" | "OPENAI_TTS_CONFIG" | null;
};

function cleanSnippet(raw: string, max = 320) {
  return raw.replace(/\s+/g, " ").trim().slice(0, max);
}

export async function synthesizeOpenAiSpeech(text: string): Promise<OpenAiTtsResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const start = Date.now();

  if (!apiKey) {
    return {
      audioBase64: null,
      mimeType: "audio/mpeg",
      model: OPENAI_TTS_MODEL,
      voice: OPENAI_TTS_VOICE,
      latencyMs: 0,
      providerStatus: null,
      providerError: "OPENAI_API_KEY missing",
      providerBodySnippet: null,
      timeout: false,
      warningCode: "OPENAI_TTS_CONFIG"
    };
  }

  const input = text.trim().slice(0, 4_000);
  if (!input) {
    return {
      audioBase64: null,
      mimeType: "audio/mpeg",
      model: OPENAI_TTS_MODEL,
      voice: OPENAI_TTS_VOICE,
      latencyMs: 0,
      providerStatus: null,
      providerError: "No text provided for OpenAI TTS",
      providerBodySnippet: null,
      timeout: false,
      warningCode: "OPENAI_TTS_FAILED"
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TTS_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_TTS_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_TTS_MODEL,
        voice: OPENAI_TTS_VOICE,
        input,
        response_format: "mp3"
      })
    });

    if (!response.ok) {
      const providerBodySnippet = cleanSnippet(await response.text());
      return {
        audioBase64: null,
        mimeType: "audio/mpeg",
        model: OPENAI_TTS_MODEL,
        voice: OPENAI_TTS_VOICE,
        latencyMs: Date.now() - start,
        providerStatus: response.status,
        providerError: `OpenAI TTS request failed (${response.status})`,
        providerBodySnippet,
        timeout: false,
        warningCode: response.status === 401 || response.status === 403 ? "OPENAI_TTS_CONFIG" : "OPENAI_TTS_FAILED"
      };
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    if (!audioBuffer.length) {
      return {
        audioBase64: null,
        mimeType: "audio/mpeg",
        model: OPENAI_TTS_MODEL,
        voice: OPENAI_TTS_VOICE,
        latencyMs: Date.now() - start,
        providerStatus: response.status,
        providerError: "OpenAI TTS returned an empty audio buffer",
        providerBodySnippet: null,
        timeout: false,
        warningCode: "OPENAI_TTS_FAILED"
      };
    }

    return {
      audioBase64: audioBuffer.toString("base64"),
      mimeType: "audio/mpeg",
      model: OPENAI_TTS_MODEL,
      voice: OPENAI_TTS_VOICE,
      latencyMs: Date.now() - start,
      providerStatus: response.status,
      providerError: null,
      providerBodySnippet: null,
      timeout: false,
      warningCode: null
    };
  } catch (error) {
    const isTimeout =
      controller.signal.aborted ||
      (error instanceof DOMException && error.name === "AbortError") ||
      (error instanceof Error && error.name === "AbortError");

    return {
      audioBase64: null,
      mimeType: "audio/mpeg",
      model: OPENAI_TTS_MODEL,
      voice: OPENAI_TTS_VOICE,
      latencyMs: Date.now() - start,
      providerStatus: null,
      providerError: error instanceof Error ? error.message : "Unknown OpenAI TTS error",
      providerBodySnippet: null,
      timeout: isTimeout,
      warningCode: "OPENAI_TTS_FAILED"
    };
  } finally {
    clearTimeout(timeout);
  }
}

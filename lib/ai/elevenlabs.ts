const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

export type ElevenLabsSpeechResult = {
  audioBuffer: Buffer | null;
  mimeType: string;
  providerError: string | null;
  voiceId: string;
  modelId: string;
  latencyMs: number;
};

export async function synthesizeVexaSpeech(text: string): Promise<ElevenLabsSpeechResult> {
  const apiKey = process.env.ELEVEN_API;
  const voiceId = "7piC4m7q8WrpEAnMj5xC";
  const modelId = "eleven_v3";
  const start = Date.now();

  if (!apiKey) {
    return {
      audioBuffer: null,
      mimeType: "audio/mpeg",
      providerError: "ELEVEN_API missing",
      voiceId,
      modelId,
      latencyMs: 0
    };
  }

  const cleanedText = text.trim().slice(0, 2200);

  if (!cleanedText) {
    return {
      audioBuffer: null,
      mimeType: "audio/mpeg",
      providerError: "No text provided for TTS",
      voiceId,
      modelId,
      latencyMs: 0
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text: cleanedText,
        model_id: modelId,
        output_format: "mp3_44100_128"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        audioBuffer: null,
        mimeType: "audio/mpeg",
        providerError: `ElevenLabs request failed (${response.status}): ${errorText.slice(0, 220)}`,
        voiceId,
        modelId,
        latencyMs: Date.now() - start
      };
    }

    const audioArrayBuffer = await response.arrayBuffer();

    return {
      audioBuffer: Buffer.from(audioArrayBuffer),
      mimeType: response.headers.get("content-type") || "audio/mpeg",
      providerError: null,
      voiceId,
      modelId,
      latencyMs: Date.now() - start
    };
  } catch (error) {
    return {
      audioBuffer: null,
      mimeType: "audio/mpeg",
      providerError: error instanceof Error ? error.message : "Unknown ElevenLabs error",
      voiceId,
      modelId,
      latencyMs: Date.now() - start
    };
  } finally {
    clearTimeout(timeout);
  }
}

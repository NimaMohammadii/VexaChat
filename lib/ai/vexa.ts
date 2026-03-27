const VEXA_SYSTEM_PROMPT =
  "You are Vexa, a live AI voice-room companion. Sound natural, social, and spoken. Keep replies concise (1-3 short sentences), avoid markdown/bullets unless asked, and be useful immediately.";

type GenerateVexaOptions = {
  roomContext?: {
    roomName?: string | null;
    participantCount?: number;
  };
};

const VEXA_FALLBACK_RESPONSE = "I’m with you live. Give me one short line and I’ll answer quickly.";

export async function generateVexaResponse(prompt: string, options: GenerateVexaOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      response: "Vexa is not configured yet. Please add OPENAI_API_KEY on the server.",
      providerError: "OPENAI_API_KEY missing",
      model: null,
      latencyMs: 0
    };
  }

  const cleanPrompt = prompt.trim().slice(0, 1400);
  const roomLine = options.roomContext?.roomName
    ? `Room: ${options.roomContext.roomName}. Members live now: ${options.roomContext.participantCount ?? 0}.`
    : `Members live now: ${options.roomContext?.participantCount ?? 0}.`;

  const controller = new AbortController();
  const start = Date.now();
  const timeout = setTimeout(() => controller.abort(), 14000);
  const model = process.env.OPENAI_VEXA_MODEL || "gpt-4o-mini";

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: `${VEXA_SYSTEM_PROMPT}\n${roomLine}` }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: cleanPrompt }]
          }
        ],
        temperature: 0.7,
        max_output_tokens: 160
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return {
        response: VEXA_FALLBACK_RESPONSE,
        providerError: `OpenAI request failed (${apiResponse.status}): ${errorText.slice(0, 220)}`,
        model,
        latencyMs: Date.now() - start
      };
    }

    const data = (await apiResponse.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
    };

    const outputText =
      data.output_text?.trim() ||
      data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text" || item.text)?.text?.trim() ||
      "";

    return {
      response: outputText || VEXA_FALLBACK_RESPONSE,
      providerError: null,
      model,
      latencyMs: Date.now() - start
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return {
      response: VEXA_FALLBACK_RESPONSE,
      providerError: `Vexa provider error: ${message}`,
      model,
      latencyMs: Date.now() - start
    };
  } finally {
    clearTimeout(timeout);
  }
}

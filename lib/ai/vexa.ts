const VEXA_SYSTEM_PROMPT =
  "You are Vexa, an in-room AI companion inside a private live voice room. Reply with concise, spoken-style help. Usually keep answers to 1-3 short sentences unless the user asks for depth.";

type GenerateVexaOptions = {
  roomContext?: {
    roomName?: string | null;
    participantCount?: number;
  };
};

const VEXA_FALLBACK_RESPONSE = "I’m here with you in the room. Could you rephrase that in one short sentence?";

export async function generateVexaResponse(prompt: string, options: GenerateVexaOptions = {}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      response: "Vexa is not configured yet. Please add OPENAI_API_KEY on the server.",
      providerError: "OPENAI_API_KEY missing"
    };
  }

  const roomLine = options.roomContext?.roomName
    ? `Room context: ${options.roomContext.roomName} with ${options.roomContext.participantCount ?? 0} participants.`
    : "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: `${VEXA_SYSTEM_PROMPT}\n${roomLine}`.trim() }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }]
          }
        ],
        max_output_tokens: 220
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return {
        response: VEXA_FALLBACK_RESPONSE,
        providerError: `OpenAI request failed (${apiResponse.status}): ${errorText.slice(0, 200)}`
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
      providerError: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return {
      response: VEXA_FALLBACK_RESPONSE,
      providerError: `Vexa provider error: ${message}`
    };
  } finally {
    clearTimeout(timeout);
  }
}

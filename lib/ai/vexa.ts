const VEXA_SYSTEM_PROMPT =
  "You are Vexa, a live AI companion inside a private voice room. Keep responses concise, natural, social, and easy to say aloud. Usually answer in 1-3 short sentences unless asked for more.";

export async function generateVexaResponse(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: VEXA_SYSTEM_PROMPT }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }]
        }
      ],
      max_output_tokens: 220
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { output_text?: string };

  return data.output_text?.trim() || "I’m here. Could you ask that one more time in a shorter way?";
}

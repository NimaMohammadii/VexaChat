import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MINI_APP_URL = "https://chaty.vexaagent.workers.dev";
const MINI_APP_TEXT = "Open Vexa";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number | string };
    text?: string;
    from?: { first_name?: string };
  };
};

async function sendTelegramMessage(botToken: string, chatId: number | string, text: string) {
  return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: MINI_APP_TEXT,
              web_app: { url: MINI_APP_URL }
            }
          ]
        ]
      }
    })
  });
}

export async function POST(request: NextRequest) {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({ error: "BOT_TOKEN is not configured" }, { status: 500 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const chatId = update?.message?.chat?.id;
  const text = update?.message?.text ?? "";
  const firstName = update?.message?.from?.first_name ?? "there";

  if (!chatId) {
    return NextResponse.json({ ok: true });
  }

  if (text.startsWith("/start")) {
    await sendTelegramMessage(botToken, chatId, `Hi ${firstName}, welcome to Vexa. Tap the button below to open the app.`);
    return NextResponse.json({ ok: true });
  }

  await sendTelegramMessage(botToken, chatId, "Tap the button below to open Vexa.");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "telegram-webhook" });
}

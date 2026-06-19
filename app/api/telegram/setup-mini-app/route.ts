import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MINI_APP_URL = "https://chaty.vexaagent.workers.dev";
const MENU_BUTTON_TEXT = "Open Vexa";
const SETUP_CODE = "vexa-mini-app-setup";
const WEBHOOK_URL = `${MINI_APP_URL}/api/telegram/webhook`;

async function callTelegramApi(botToken: string, method: string, payload: unknown) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => null);
  return { response, result };
}

export async function POST(request: NextRequest) {
  const botToken = process.env.BOT_TOKEN;
  const setupCode = request.nextUrl.searchParams.get("code") || "";

  if (!botToken) {
    return NextResponse.json({ error: "BOT_TOKEN is not configured" }, { status: 500 });
  }

  if (setupCode !== SETUP_CODE) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const menu = await callTelegramApi(botToken, "setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: MENU_BUTTON_TEXT,
      web_app: {
        url: MINI_APP_URL
      }
    }
  });

  if (!menu.response.ok || !menu.result?.ok) {
    return NextResponse.json(
      {
        error: "Telegram setChatMenuButton failed",
        telegram: menu.result
      },
      { status: 502 }
    );
  }

  const webhook = await callTelegramApi(botToken, "setWebhook", {
    url: WEBHOOK_URL,
    allowed_updates: ["message"]
  });

  if (!webhook.response.ok || !webhook.result?.ok) {
    return NextResponse.json(
      {
        error: "Telegram setWebhook failed",
        telegram: webhook.result
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, miniAppUrl: MINI_APP_URL, buttonText: MENU_BUTTON_TEXT, webhookUrl: WEBHOOK_URL });
}

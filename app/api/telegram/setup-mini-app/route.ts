import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MINI_APP_URL = "https://chaty.vexaagent.workers.dev";
const MENU_BUTTON_TEXT = "Open Vexa";
const SETUP_CODE = "vexa-mini-app-setup";

export async function POST(request: NextRequest) {
  const botToken = process.env.BOT_TOKEN;
  const setupCode = request.nextUrl.searchParams.get("code") || "";

  if (!botToken) {
    return NextResponse.json({ error: "BOT_TOKEN is not configured" }, { status: 500 });
  }

  if (setupCode !== SETUP_CODE) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      menu_button: {
        type: "web_app",
        text: MENU_BUTTON_TEXT,
        web_app: {
          url: MINI_APP_URL
        }
      }
    })
  });

  const telegramResult = await telegramResponse.json().catch(() => null);

  if (!telegramResponse.ok || !telegramResult?.ok) {
    return NextResponse.json(
      {
        error: "Telegram setChatMenuButton failed",
        telegram: telegramResult
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, miniAppUrl: MINI_APP_URL, buttonText: MENU_BUTTON_TEXT });
}

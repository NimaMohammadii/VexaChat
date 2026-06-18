import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSetupSecret() {
  return process.env.TELEGRAM_SETUP_SECRET || process.env.CRON_SECRET || "";
}

function getRequestSecret(request: NextRequest) {
  return request.headers.get("x-setup-secret") || request.nextUrl.searchParams.get("secret") || "";
}

function getMiniAppUrl(request: NextRequest) {
  const explicitUrl = process.env.TELEGRAM_MINI_APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const botToken = process.env.BOT_TOKEN;
  const setupSecret = getSetupSecret();
  const requestSecret = getRequestSecret(request);

  if (!botToken) {
    return NextResponse.json({ error: "BOT_TOKEN is not configured" }, { status: 500 });
  }

  if (!setupSecret || requestSecret !== setupSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const miniAppUrl = getMiniAppUrl(request);
  const buttonText = process.env.TELEGRAM_MENU_BUTTON_TEXT || "Open Vexa";

  const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      menu_button: {
        type: "web_app",
        text: buttonText,
        web_app: {
          url: miniAppUrl
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

  return NextResponse.json({ ok: true, miniAppUrl, buttonText });
}

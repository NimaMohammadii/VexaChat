"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

const TELEGRAM_SDK_ID = "telegram-web-app-sdk";
const TELEGRAM_SDK_SRC = "https://telegram.org/js/telegram-web-app.js";

function notifyTelegramReady() {
  const webApp = window.Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
}

export function TelegramMiniAppReady() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      notifyTelegramReady();
      return;
    }

    const existingScript = document.getElementById(TELEGRAM_SDK_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", notifyTelegramReady, { once: true });
      return () => existingScript.removeEventListener("load", notifyTelegramReady);
    }

    const script = document.createElement("script");
    script.id = TELEGRAM_SDK_ID;
    script.src = TELEGRAM_SDK_SRC;
    script.async = true;
    script.addEventListener("load", notifyTelegramReady, { once: true });
    document.head.appendChild(script);

    return () => script.removeEventListener("load", notifyTelegramReady);
  }, []);

  return null;
}

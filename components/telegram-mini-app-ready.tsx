"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        requestFullscreen?: () => void;
        disableVerticalSwipes?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        safeAreaInset?: {
          top?: number;
          right?: number;
          bottom?: number;
          left?: number;
        };
        contentSafeAreaInset?: {
          top?: number;
          right?: number;
          bottom?: number;
          left?: number;
        };
      };
    };
  }
}

const TELEGRAM_SDK_ID = "telegram-web-app-sdk";
const TELEGRAM_SDK_SRC = "https://telegram.org/js/telegram-web-app.js";
const TELEGRAM_AUTH_COOKIE = "vexa_telegram_init_data";

function setPlatform(platform: "telegram" | "web") {
  document.documentElement.dataset.platform = platform;
  document.body.dataset.platform = platform;
}

function saveTelegramAuthCookie() {
  const initData = window.Telegram?.WebApp?.initData;

  if (!initData) {
    return;
  }

  document.cookie = `${TELEGRAM_AUTH_COOKIE}=${encodeURIComponent(initData)}; path=/; max-age=86400; SameSite=Lax; Secure`;
}

function setTelegramSafeAreaVars() {
  const webApp = window.Telegram?.WebApp;
  const safeArea = webApp?.contentSafeAreaInset ?? webApp?.safeAreaInset;

  document.documentElement.style.setProperty("--telegram-safe-area-top", `${safeArea?.top ?? 0}px`);
  document.documentElement.style.setProperty("--telegram-safe-area-right", `${safeArea?.right ?? 0}px`);
  document.documentElement.style.setProperty("--telegram-safe-area-bottom", `${safeArea?.bottom ?? 0}px`);
  document.documentElement.style.setProperty("--telegram-safe-area-left", `${safeArea?.left ?? 0}px`);
}

function notifyTelegramReady() {
  const webApp = window.Telegram?.WebApp;

  if (!webApp) {
    setPlatform("web");
    return;
  }

  setPlatform("telegram");
  saveTelegramAuthCookie();
  setTelegramSafeAreaVars();
  webApp.ready?.();
  webApp.expand?.();
  webApp.disableVerticalSwipes?.();
  webApp.setHeaderColor?.("#000000");
  webApp.setBackgroundColor?.("#000000");

  const requestFullscreen = () => {
    saveTelegramAuthCookie();
    setTelegramSafeAreaVars();
    webApp.expand?.();
    webApp.requestFullscreen?.();
  };

  requestFullscreen();
  window.requestAnimationFrame(requestFullscreen);
  window.setTimeout(requestFullscreen, 300);
}

export function TelegramMiniAppReady() {
  useEffect(() => {
    setPlatform("web");

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

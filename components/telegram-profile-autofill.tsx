"use client";

import { useEffect } from "react";

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function cleanUsername(value: string) {
  return value.replace(/^@+/, "").trim().toLowerCase();
}

function lockInput(input: HTMLInputElement) {
  input.readOnly = true;
  input.setAttribute("aria-readonly", "true");
  input.style.pointerEvents = "none";
  input.style.opacity = "0.72";
  input.style.cursor = "not-allowed";
}

function applyTelegramProfile() {
  if (!window.location.pathname.startsWith("/me")) {
    return;
  }

  const profile = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
  if (!profile) {
    return;
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  const username = cleanUsername(profile.username || "");

  const nameInput = document.querySelector<HTMLInputElement>('input[placeholder="Your name"]');
  const usernameInput = document.querySelector<HTMLInputElement>('input[placeholder="username"]');

  if (nameInput && fullName) {
    if (nameInput.value !== fullName) {
      setNativeInputValue(nameInput, fullName);
    }
    lockInput(nameInput);
  }

  if (usernameInput && username) {
    if (usernameInput.value !== username) {
      setNativeInputValue(usernameInput, username);
    }
    lockInput(usernameInput);
  }
}

export function TelegramProfileAutofill() {
  useEffect(() => {
    applyTelegramProfile();
    const timers = [250, 700, 1400, 2400].map((delay) => window.setTimeout(applyTelegramProfile, delay));
    const interval = window.setInterval(applyTelegramProfile, 1500);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(interval);
    };
  }, []);

  return null;
}

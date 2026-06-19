type TelegramInitUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

const TELEGRAM_AUTH_COOKIE = "vexa_telegram_init_data";
const encoder = new TextEncoder();

function bytesToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: ArrayBuffer | Uint8Array | string, value: string) {
  const rawKey = typeof key === "string" ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey("raw", rawKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const cookie = cookies.find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

async function verifyTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? "";

  if (!hash) {
    return null;
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await hmacSha256("WebAppData", botToken);
  const calculatedHash = bytesToHex(await hmacSha256(secretKey, dataCheckString));

  if (!safeEqual(calculatedHash, hash)) {
    return null;
  }

  const rawUser = params.get("user");
  if (!rawUser) {
    return null;
  }

  return JSON.parse(rawUser) as TelegramInitUser;
}

export async function getTelegramAuthenticatedUser(request: Request) {
  const botToken = process.env.BOT_TOKEN;
  const initData = request.headers.get("x-telegram-init-data") || getCookie(request, TELEGRAM_AUTH_COOKIE);

  if (!botToken || !initData) {
    return null;
  }

  const telegramUser = await verifyTelegramInitData(initData, botToken).catch(() => null);

  if (!telegramUser?.id) {
    return null;
  }

  const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ").trim();
  const username = telegramUser.username ?? "";

  return {
    id: `telegram-${telegramUser.id}`,
    email: username ? `${username}@telegram.local` : `telegram-${telegramUser.id}@telegram.local`,
    user_metadata: {
      full_name: fullName,
      name: fullName,
      user_name: username,
      avatar_url: telegramUser.photo_url ?? "",
      telegram_id: telegramUser.id
    }
  };
}

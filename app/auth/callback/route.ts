import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function getPublicOrigin(url: URL) {
  const h = headers();

  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (envAppUrl) return envAppUrl;

  const forwardedProto = h.get("x-forwarded-proto") ?? "https";
  const forwardedHost = h.get("x-forwarded-host") ?? h.get("host");

  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  // last resort (may be internal on some hosts)
  return url.origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const origin = getPublicOrigin(url);

  if (code) {
    const supabase = createSupabaseServerClient({ canSetCookies: true });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(origin);
}

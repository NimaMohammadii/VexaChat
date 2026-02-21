import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

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
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(origin);
}

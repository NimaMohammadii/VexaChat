import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? "/";

  const safePath =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const redirectUrl = new URL(safePath, requestUrl.origin);
  const response = NextResponse.redirect(redirectUrl);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !code) {
    return response;
  }

  const cookieStore = cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      }
    }
  });

  await supabase.auth.exchangeCodeForSession(code);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const name =
      (user.user_metadata.full_name as string | undefined) ??
      (user.user_metadata.name as string | undefined) ??
      user.email?.split("@")[0] ??
      "User";

    await supabase.from("listings").upsert(
      {
        id: user.id,
        user_id: user.id,
        name,
        city: "",
        description: "",
        image_url: null,
        is_published: false
      },
      {
        onConflict: "id",
        ignoreDuplicates: true
      }
    );
  }

  return response;
}

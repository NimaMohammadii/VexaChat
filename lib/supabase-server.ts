import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CreateSupabaseServerClientOptions = {
  canSetCookies?: boolean;
};

type GetAuthenticatedUserOptions = {
  canSetCookies?: boolean;
};

export function createSupabaseServerClient({ canSetCookies = false }: CreateSupabaseServerClientOptions = {}) {
  const cookieStore = cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        if (!canSetCookies) {
          return;
        }

        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignore cookie writes in read-only rendering contexts.
        }
      },
      remove(name: string, options: CookieOptions) {
        if (!canSetCookies) {
          return;
        }

        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Ignore cookie writes in read-only rendering contexts.
        }
      }
    }
  });
}

export async function getAuthenticatedUser({ canSetCookies = false }: GetAuthenticatedUserOptions = {}) {
  const supabase = createSupabaseServerClient({ canSetCookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

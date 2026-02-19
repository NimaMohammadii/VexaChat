// lib/supabase-client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Log helpful message in server logs / build logs if missing envs
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Create a browser client that uses PKCE (code flow)
  // PKCE forces code flow and prevents implicit/hash token redirect.
  return createBrowserClient(url ?? "", key ?? "", {
    auth: {
      flowType: "pkce"
    }
  });
}

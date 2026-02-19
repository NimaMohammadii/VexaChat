"use client";

import { createClient } from "@supabase/supabase-js";

export function GoogleAuthControl() {
  const handleClick = async (): Promise<void> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return;
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const result = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (result && result.error) {
        console.error("Google OAuth sign-in error", result.error);
        return;
      }

      const oauthUrl = result && result.data ? result.data.url : null;
      if (oauthUrl) {
        window.location.href = oauthUrl;
      }
    } catch (error) {
      console.error("Google OAuth sign-in failed", error);
    }
  };

  return (
    <button type="button" onClick={() => void handleClick()}>
      Sign in with Google
    </button>
  );
}

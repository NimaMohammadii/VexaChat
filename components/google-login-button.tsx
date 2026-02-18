"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function GoogleLoginButton({ redirectTo = "/auth/callback?next=/apply", className }: { redirectTo?: string; className?: string }) {
  async function onClick() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`
      }
    });
  }

  return (
    <button type="button" onClick={onClick} className={className ?? "bw-button w-full"}>
      Login with Google
    </button>
  );
}

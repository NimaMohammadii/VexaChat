"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function GoogleLoginButton({ className }: { className?: string }) {
  async function onClick() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  }

  return (
    <button type="button" onClick={onClick} className={className ?? "bw-button w-full"}>
      Login with Google
    </button>
  );
}

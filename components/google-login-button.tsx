"use client";

import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function GoogleLoginButton({ className }: { className?: string }) {
  async function onClick() {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      throw error;
    }
  }

  return (
    <button type="button" onClick={onClick} className={className ?? "bw-button w-full"}>
      Login with Google
    </button>
  );
}

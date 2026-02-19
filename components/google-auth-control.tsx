"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

export function GoogleAuthControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setErrorMessage("Google sign-in is not configured.");
      setIsLoading(false);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const nextPath = `${window.location.pathname}${window.location.search}`;
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true
      }
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    if (!data.url) {
      setErrorMessage("Failed to start Google sign-in.");
      setIsLoading(false);
      return;
    }

    window.location.assign(data.url);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={() => void handleClick()} disabled={isLoading}>
        {isLoading ? "Redirecting..." : "Sign in with Google"}
      </button>
      {errorMessage ? <p className="text-xs text-red-400">{errorMessage}</p> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

export function GoogleAuthControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    const nextPath = `${window.location.pathname}${window.location.search}`;
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          skipBrowserRedirect: true
        }
      });

      if (error) {
        throw error;
      }

      if (!data.url) {
        throw new Error("Google sign-in redirect URL was not provided.");
      }

      window.location.assign(data.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start Google sign-in.";
      setErrorMessage(message);
      setIsLoading(false);
    }
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

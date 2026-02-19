// components/google-auth-control.tsx
"use client";

import { useState } from "react";
import { createSupabaseClient } from "../lib/supabase-client";

export function GoogleAuthControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setErrorMessage("Google sign-in is not configured (missing env).");
        setIsLoading(false);
        return;
      }

      // create browser client configured with PKCE (from lib)
      const supabase = createSupabaseClient();

      const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      const appOrigin = configuredSiteUrl ?? window.location.origin;

      // build callback that returns user to our /auth/callback route with a next param
      const nextPath = `${window.location.pathname}${window.location.search}`;
      const callbackUrl = new URL("/auth/callback", appOrigin);
      callbackUrl.searchParams.set("next", nextPath);

      // Start OAuth flow; using redirectTo ensures provider returns to our callback
      // skipBrowserRedirect true makes SDK return a URL which we then assign (works in all browsers)
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

      if (!data?.url) {
        throw new Error("Google sign-in redirect URL was not provided.");
      }

      // Redirect browser to the provider URL returned by Supabase
      window.location.assign(data.url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start Google sign-in.";
      setErrorMessage(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isLoading}
        className="px-3 py-2 rounded-md bg-white text-black"
      >
        {isLoading ? "Redirecting..." : "Sign in with Google"}
      </button>
      {errorMessage ? <p className="text-xs text-red-400">{errorMessage}</p> : null}
    </div>
  );
}

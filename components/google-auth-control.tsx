"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase-client";

type UserSession = {
  avatarUrl: string | null;
  displayName: string;
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M21.805 10.023H12v3.955h5.627c-.243 1.273-.972 2.352-2.063 3.07l3.333 2.588c1.944-1.79 3.063-4.43 3.063-7.568 0-.718-.064-1.41-.155-2.045Z"
        fill="#4285F4"
      />
      <path
        d="M12 22.203c2.79 0 5.127-.925 6.836-2.567l-3.333-2.588c-.926.621-2.11.999-3.503.999-2.686 0-4.96-1.813-5.774-4.25H2.78v2.67a10.302 10.302 0 0 0 9.22 5.736Z"
        fill="#34A853"
      />
      <path
        d="M6.226 13.797a6.198 6.198 0 0 1-.323-1.986c0-.689.117-1.354.323-1.986V7.155H2.78A10.302 10.302 0 0 0 1.688 11.81c0 1.656.396 3.225 1.092 4.655l3.446-2.668Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.575c1.517 0 2.879.522 3.949 1.547l2.96-2.96C17.123 2.503 14.786 1.42 12 1.42A10.302 10.302 0 0 0 2.78 7.155l3.446 2.67c.814-2.44 3.088-4.25 5.774-4.25Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthControl() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      if (!supabase) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      const {
        data: { session: authSession }
      } = await supabase.auth.getSession();

      const user = authSession?.user;

      if (!user) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      const userMetadata = user.user_metadata ?? {};

      const displayName =
        userMetadata.full_name ??
        userMetadata.name ??
        user.email ??
        "User";

      setSession({
        avatarUrl: userMetadata.avatar_url ?? null,
        displayName
      });
      setIsLoading(false);
    };

    void loadSession();
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      return;
    }

    const { data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (data.url) {
      window.location.href = data.url;
    }
  };

  if (isLoading) {
    return <div className="h-10 w-10 animate-pulse rounded-full border border-line bg-white/5" aria-hidden />;
  }

  if (session) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-line/80 bg-white/[0.04] px-2 py-1.5 backdrop-blur-sm dark:bg-white/[0.03]">
        {session.avatarUrl ? (
          <img src={session.avatarUrl} alt={session.displayName} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-paper">
            {session.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleGoogleLogin()}
      className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-white/[0.06] px-4 py-2 text-sm font-medium text-paper shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <GoogleIcon />
      <span>Sign in with Google</span>
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

function getInitial(displayName: string) {
  return displayName.trim().slice(0, 1).toUpperCase() || "U";
}

export function GoogleAuthControl() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const avatarButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const supabase = createSupabaseClient();

    const syncSession = async () => {
      const {
        data: { session: authSession }
      } = await supabase.auth.getSession();

      const user = authSession?.user;

      if (!user) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      const displayName = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? "User";
      const response = await fetch("/api/me", { cache: "no-store" }).catch(() => null);
      const profilePayload = response?.ok ? ((await response.json()) as { profile: { avatarUrl: string } | null }) : null;

      setSession({
        avatarUrl: profilePayload?.profile?.avatarUrl || user.user_metadata.avatar_url || null,
        displayName
      });
      setIsLoading(false);
    };

    void syncSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event: unknown, authSession: { user?: { user_metadata: { full_name?: string; name?: string; avatar_url?: string }; email?: string | null } } | null) => {
      const user = authSession?.user;

      if (!user) {
        setSession(null);
        setIsOpen(false);
        return;
      }

      const displayName = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? "User";
      setSession({
        avatarUrl: user.user_metadata.avatar_url ?? null,
        displayName
      });
    });

    const handleAvatarUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ avatarUrl?: string }>;
      const nextAvatarUrl = customEvent.detail?.avatarUrl;

      if (!nextAvatarUrl) {
        return;
      }

      setSession((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          avatarUrl: nextAvatarUrl
        };
      });
    };

    window.addEventListener("profile-avatar-updated", handleAvatarUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("profile-avatar-updated", handleAvatarUpdated);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && event.target instanceof Node && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        avatarButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    const supabase = createSupabaseClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/auth/callback`
      }
    });

    if (error) {
      console.error("OAuth Error:", error);
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseClient();
    setIsOpen(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out Error:", error);
      return;
    }

    setSession(null);
  };

  const goToProfile = () => {
    setIsOpen(false);
    router.push("/me");
  };

  if (isLoading) {
    return <div className="h-10 w-10 animate-pulse rounded-full border border-line bg-white/5" aria-hidden />;
  }

  if (session) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          ref={avatarButtonRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls="profile-menu"
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-line/80 bg-white/[0.06] text-sm font-semibold text-paper transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {session.avatarUrl ? (
            <img src={session.avatarUrl} alt={session.displayName} className="h-full w-full object-cover" />
          ) : (
            <span>{getInitial(session.displayName)}</span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="profile-menu"
              key="profile-menu"
              role="menu"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute right-0 z-20 mt-2 w-44 origin-top-right rounded-xl border border-line bg-black/90 p-1.5 shadow-xl backdrop-blur"
            >
              <button
                type="button"
                role="menuitem"
                onClick={goToProfile}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-paper transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                My Profile
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleSignOut()}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-paper transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
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

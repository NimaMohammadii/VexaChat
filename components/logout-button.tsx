"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = useMemo(() => createSupabaseClient(), []);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 shadow-sm transition-all duration-200 hover:border-white/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}

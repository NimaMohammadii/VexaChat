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
      className="inline-flex items-center justify-center rounded-xl border border-red-500 bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-transparent hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}

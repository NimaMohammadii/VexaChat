"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function onClick() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={onClick} className={className ?? "bw-button"}>
      Sign out
    </button>
  );
}

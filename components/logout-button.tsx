"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button type="button" className="bw-button-muted" onClick={() => signOut({ callbackUrl: "/sign-in" })}>
      Logout
    </button>
  );
}

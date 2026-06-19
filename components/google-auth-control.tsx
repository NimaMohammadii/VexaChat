"use client";

import { useEffect, useState } from "react";

export function GoogleAuthControl() {
  const [name, setName] = useState("My Profile");
  const [username, setUsername] = useState("Profile");
  const [initial, setInitial] = useState("S");

  useEffect(() => {
    const readProfile = () => {
      const tg = (window as any).Telegram?.WebApp;
      const profile = tg?.initDataUnsafe?.user;
      const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
      const displayName = fullName || profile?.username || "My Profile";

      setName(displayName);
      setUsername(profile?.username ? `@${profile.username}` : "Profile");
      setInitial(displayName.trim()[0] || "S");
    };

    readProfile();
    window.setTimeout(readProfile, 300);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-2 text-paper shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#FF2E63]/20 text-xs font-semibold text-white">
        {initial}
      </span>
      <span className="min-w-0 text-left leading-none">
        <span className="block max-w-[7.5rem] truncate text-xs font-semibold text-white">{name}</span>
        <span className="mt-1 block max-w-[7.5rem] truncate text-[10px] text-white/55">{username}</span>
      </span>
    </div>
  );
}

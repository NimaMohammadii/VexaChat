"use client";

import { useEffect, useState } from "react";

export function GoogleAuthControl() {
  const [initial, setInitial] = useState("S");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    const readProfile = () => {
      const tg = (window as any).Telegram?.WebApp;
      const profile = tg?.initDataUnsafe?.user;
      const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();
      const displayName = fullName || profile?.username || "S";

      setInitial(displayName.trim()[0] || "S");
      setPhotoUrl(profile?.photo_url || "");
    };

    readProfile();
    window.setTimeout(readProfile, 300);
  }, []);

  return (
    <div className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] text-paper shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-sm">
      {photoUrl ? (
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="inline-flex h-full w-full items-center justify-center bg-[#FF2E63]/20 text-xs font-semibold text-white">
          {initial}
        </span>
      )}
    </div>
  );
}

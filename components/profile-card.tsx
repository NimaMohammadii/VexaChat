"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useCallback, useRef, useState } from "react";
import { Profile } from "@/lib/types";

export function ProfileCard({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isSelected, setIsSelected] = useState(false);
  const isNavigatingRef = useRef(false);
  const primaryImage = profile.images?.[0] || profile.imageUrl || null;

  const navigateToProfile = useCallback(() => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;
    setIsSelected(true);

    window.setTimeout(() => {
      router.push(`/profile/${profile.id}`);
    }, 180);
  }, [profile.id, router]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigateToProfile();
      }
    },
    [navigateToProfile]
  );

  return (
    <div
      className={`profile-card card relative overflow-hidden rounded-xl bg-slate shadow-sm ${profile.isTop ? "top" : ""} ${isSelected ? "selected" : ""}`}
      onClick={navigateToProfile}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`View ${profile.name}'s profile`}
    >
      {profile.isTop ? (
        <span className="absolute right-3 top-3 z-10 rounded-full border border-violet-300/35 bg-[linear-gradient(135deg,rgba(0,0,0,0.92),rgba(88,28,135,0.5))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/95 backdrop-blur-sm shadow-[0_0_12px_rgba(168,85,247,0.38)]">
          TOP
        </span>
      ) : null}
      <div className="profile-image-wrapper aspect-[3/4] w-full">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={profile.name}
            width={600}
            height={800}
            className="h-full w-full"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-[#111111] flex items-center justify-center text-[#333] text-sm" />
        )}
      </div>
      <div className="space-y-3 px-3 pb-3 pt-2">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold leading-tight text-paper">{profile.name}</h2>
          <p className="text-xs text-[#AAAAAA]">{profile.city}</p>
          <p className="text-xs text-[#AAAAAA]">${profile.price}/hr</p>
        </div>
        <span className="inline-flex w-full items-center justify-center rounded-lg border border-line px-3 py-1.5 text-xs text-paper transition hover:border-paper">
          View
        </span>
      </div>
    </div>
  );
}

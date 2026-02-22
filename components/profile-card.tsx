"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { KeyboardEvent, useCallback, useRef, useState } from "react";
import { Profile } from "@/lib/types";
import { FavoriteHeartButton } from "@/components/favorite-heart-button";

export function ProfileCard({
  profile,
  isFavorite = false
}: {
  profile: Profile;
  isFavorite?: boolean;
}) {
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
      router.push(`/p/${profile.id}`);
    }, 120);
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
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className={`profile-card card relative overflow-hidden rounded-xl bg-slate shadow-sm ${profile.isTop ? "top" : ""} ${isSelected ? "selected" : ""}`}
      onClick={navigateToProfile}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={`View ${profile.name}'s profile`}
    >
      <FavoriteHeartButton profileId={profile.id} initialActive={isFavorite} />
      {profile.verified ? <span className="verified-glow absolute right-3 top-3 z-10 rounded-full border border-emerald-300/45 bg-emerald-500/10 px-2 py-1 text-[10px]">Verified</span> : null}
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
      </div>
    </motion.div>
  );
}

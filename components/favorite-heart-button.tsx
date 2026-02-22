"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export function FavoriteHeartButton({ profileId, initialActive }: { profileId: string; initialActive: boolean }) {
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    const next = !active;
    const response = await fetch(next ? "/api/me/favorites" : `/api/me/favorites/${profileId}`, {
      method: next ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: next ? JSON.stringify({ profileId }) : undefined
    }).catch(() => null);

    if (response?.ok) {
      setActive(next);
    }

    setBusy(false);
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      animate={active ? { scale: [1, 1.22, 1] } : { scale: 1 }}
      transition={{ duration: 0.22 }}
      className={`absolute left-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur ${active ? "border-rose-400/80 bg-rose-500/20 text-rose-300" : "border-line bg-black/40 text-white/70"}`}
      onClick={(event) => {
        event.stopPropagation();
        void toggle();
      }}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      disabled={busy}
    >
      ♥
    </motion.button>
  );
}

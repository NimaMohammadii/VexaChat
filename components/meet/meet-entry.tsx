"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type MeetCard = {
  id: string;
  displayName: string;
  city: string;
  imageUrl: string;
};

export function MeetEntry() {
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<MeetCard | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/meet/card", { cache: "no-store" });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = (await response.json()) as { card: MeetCard | null };
      setCard(data.card);
      setLoading(false);
    };

    void load();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={loading ? "loading" : card ? "has-card" : "no-card"}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10"
      >
        <div className="space-y-3">
          <p className="text-xs tracking-[0.2em] text-white/55">MEET</p>
          <h1 className="text-3xl font-semibold text-white">Private connections, curated meetups.</h1>
          <p className="text-sm text-white/65">Create your Meet card and browse in a discreet, minimal space.</p>
        </div>

        <div className="bw-card p-6">
          {loading ? (
            <p className="text-sm text-white/60">Loading…</p>
          ) : card ? (
            <div className="space-y-5">
              <div className="relative h-56 overflow-hidden rounded-2xl border border-white/10">
                <img src={card.imageUrl} alt={card.displayName} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium">{card.displayName}</p>
                  <p className="text-sm text-white/65">{card.city}</p>
                </div>
                <Link href="/meet/browse" className="bw-button">Start browsing</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-white/70">You don&apos;t have a Meet card yet.</p>
              <Link href="/meet/create" className="bw-button">Create your card</Link>
            </div>
          )}
        </div>
      </motion.main>
    </AnimatePresence>
  );
}

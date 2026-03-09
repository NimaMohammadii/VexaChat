"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type MeetCard = { displayName: string; city: string; imageUrl: string };

export function MeetEntry() {
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<MeetCard | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/meet/card", { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { card: MeetCard | null };
        setCard(payload.card);
      }
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.main key={loading ? "loading" : card ? "ready" : "create"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-[#060609] px-4 py-12 text-white">
        <p className="text-xs tracking-[0.2em] text-white/60">MEET</p>
        <h1 className="text-4xl font-semibold tracking-tight">Premium request-based matching.</h1>
        <p className="max-w-xl text-sm text-white/70">Every connection starts with explicit acceptance and a cleaner, more private flow.</p>

        <section className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
          {loading && <p className="text-white/60">Loading...</p>}
          {!loading && !card && (
            <div className="space-y-3">
              <p className="text-white/75">Create your card to join Meet.</p>
              <Link href="/meet/create" className="inline-flex rounded-2xl border border-white/10 bg-white px-5 py-2.5 text-sm font-semibold text-black">Create card</Link>
            </div>
          )}
          {!loading && card && (
            <div className="space-y-4">
              <img src={card.imageUrl} alt={card.displayName} className="h-64 w-full rounded-3xl border border-white/10 object-cover" />
              <div className="flex flex-wrap gap-3">
                <Link href="/meet/browse" className="inline-flex rounded-2xl border border-white/10 bg-white px-5 py-2.5 text-sm font-semibold text-black">Browse</Link>
                <Link href="/meet/inbox" className="inline-flex rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm">Inbox</Link>
                <Link href="/meet/create" className="inline-flex rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm">Edit card</Link>
              </div>
            </div>
          )}
        </section>
      </motion.main>
    </AnimatePresence>
  );
}

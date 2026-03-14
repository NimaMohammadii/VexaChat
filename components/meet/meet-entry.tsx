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
      <motion.main key={loading ? "loading" : card ? "ready" : "create"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-black px-4 py-12 text-white">
        <p className="text-xs tracking-[0.2em] text-white/60">MEET</p>
        <h1 className="text-4xl font-semibold">Request-based matching.</h1>
        <p className="max-w-xl text-sm text-white/70">Send requests. Wait for explicit acceptance. Matches are created only after approval.</p>

        <section className="bw-card space-y-4 p-6">
          {loading && <p className="text-white/60">Loading…</p>}
          {!loading && !card && (
            <div className="space-y-3">
              <p className="text-white/75">Create your card to join Meet.</p>
              <Link href="/meet/create" className="bw-button inline-flex">Create card</Link>
            </div>
          )}
          {!loading && card && (
            <div className="space-y-4">
              <img src={card.imageUrl} alt={card.displayName} className="h-56 w-full rounded-2xl border border-white/10 object-cover" />
              <div className="flex flex-wrap gap-3">
                <Link href="/meet/browse" className="bw-button inline-flex">Browse</Link>
                <Link href="/meet/inbox" className="bw-button-muted inline-flex">Inbox</Link>
                <Link href="/meet/create" className="bw-button-muted inline-flex">Edit card</Link>
              </div>
            </div>
          )}
        </section>
      </motion.main>
    </AnimatePresence>
  );
}

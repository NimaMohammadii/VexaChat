"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { SvjBlockIcon, SvjHeartIcon, SvjXIcon } from "@/components/svj-icons";

type MeetCard = { id: string; userId: string; displayName: string; age: number; city: string; bio: string | null; imageUrl: string; intentTags: string[] };

const threshold = 120;

export function MeetBrowse() {
  const [queue, setQueue] = useState<MeetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const current = queue[0] ?? null;

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/meet/browse", { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { cards: MeetCard[] };
        setQueue(payload.cards);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const doAction = async (action: "like" | "pass" | "block", userId: string) => {
    if (busy) return;
    setBusy(true);
    const endpoint = action === "like" ? "/api/meet/like" : action === "pass" ? "/api/meet/pass" : "/api/meet/block";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "block" ? { blockedUserId: userId } : { toUserId: userId })
    });
    setQueue((items) => items.slice(1));
    setBusy(false);
  };


  return (
    <AnimatePresence mode="wait">
      <motion.main key={current?.id ?? "empty"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 bg-black px-4 py-12 text-white">
        <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Browse</h1><Link href="/meet/inbox" className="bw-button-muted inline-flex">Inbox</Link></div>
        {loading && <p className="text-white/60">Loading…</p>}
        {!loading && !current && <div className="bw-card p-8 text-center text-white/65">No cards available.</div>}
        {current && (
          <>
            <div className="relative h-[560px]">{current && <SwipeCard card={current} onLike={() => void doAction("like", current.userId)} onPass={() => void doAction("pass", current.userId)} />}</div>
            <div className="flex items-center justify-center gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="bw-button-muted gap-2" disabled={busy} onClick={() => void doAction("pass", current.userId)}><SvjXIcon className="h-4 w-4" />Pass</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="bw-button gap-2" disabled={busy} onClick={() => void doAction("like", current.userId)}><SvjHeartIcon className="h-4 w-4" />Request</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} className="bw-button-muted gap-2" disabled={busy} onClick={() => void doAction("block", current.userId)}><SvjBlockIcon className="h-4 w-4" />Block</motion.button>
            </div>
          </>
        )}
      </motion.main>
    </AnimatePresence>
  );
}

function SwipeCard({ card, onLike, onPass }: { card: MeetCard; onLike: () => void; onPass: () => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-9, 9]);

  return (
    <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} style={{ x, rotate }} onDragEnd={(_, info) => {
      if (info.offset.x > threshold) onLike();
      if (info.offset.x < -threshold) onPass();
    }} className="absolute inset-0 overflow-hidden rounded-3xl border border-white/15 bg-black">
      <img src={card.imageUrl} alt={card.displayName} className="h-[70%] w-full object-cover" />
      <div className="space-y-2 p-4"><p className="text-xl font-semibold">{card.displayName}, {card.age}</p><p className="text-sm text-white/65">{card.city}</p>{card.bio && <p className="text-sm text-white/70">{card.bio}</p>}</div>
    </motion.div>
  );
}

"use client";

import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { SvjBlockIcon, SvjHeartIcon, SvjReportIcon, SvjXIcon } from "@/components/svj-icons";

type MeetCard = {
  id: string;
  userId: string;
  displayName: string;
  age: number;
  city: string;
  bio: string | null;
  intentTags: string[];
  imageUrl: string;
};

const threshold = 120;

export function MeetBrowse() {
  const [queue, setQueue] = useState<MeetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const current = queue[0] ?? null;

  const load = async () => {
    const response = await fetch("/api/meet/browse", { cache: "no-store" });

    if (!response.ok) {
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { cards: MeetCard[] };
    setQueue(payload.cards);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const consume = () => setQueue((currentQueue) => currentQueue.slice(1));

  const takeAction = async (action: "like" | "pass" | "block", userId: string) => {
    if (busy) {
      return;
    }

    setBusy(true);
    const endpoint = action === "like" ? "/api/meet/like" : action === "pass" ? "/api/meet/pass" : "/api/meet/block";
    const body = action === "block" ? { blockedUserId: userId } : { toUserId: userId };

    await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    consume();
    setBusy(false);
  };

  const report = async (userId: string) => {
    await fetch("/api/meet/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedUserId: userId, reason: "Inappropriate behavior" })
    });
  };

  const card = useMemo(() => {
    if (!current) {
      return null;
    }

    return <SwipeCard key={current.id} card={current} onLike={() => void takeAction("like", current.userId)} onPass={() => void takeAction("pass", current.userId)} />;
  }, [current, busy]);

  return (
    <AnimatePresence mode="wait">
      <motion.main key={current?.id ?? "empty"} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: "spring", stiffness: 320, damping: 28 }} className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-4 py-10">
        <div>
          <p className="text-xs tracking-[0.2em] text-white/55">MEET BROWSE</p>
          <h1 className="text-2xl font-semibold">Discover people</h1>
        </div>

        {loading ? <p className="text-white/60">Loading cards…</p> : null}

        {!loading && !current ? (
          <div className="bw-card p-8 text-center text-white/70">No more people right now. Check back later.</div>
        ) : null}

        {!loading && current ? (
          <>
            <div className="relative h-[540px]">{queue[1] ? <div className="absolute inset-x-3 top-2 h-full rounded-3xl border border-white/10 bg-white/5" /> : null}{card}</div>
            <div className="flex items-center justify-center gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => void takeAction("pass", current.userId)} className="bw-button-muted gap-2"><SvjXIcon className="h-4 w-4" />Pass</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => void takeAction("like", current.userId)} className="bw-button gap-2"><SvjHeartIcon className="h-4 w-4" />Like</motion.button>
              <details className="relative">
                <summary className="bw-button-muted cursor-pointer list-none px-3">...</summary>
                <div className="absolute right-0 z-10 mt-2 w-44 space-y-1 rounded-xl border border-white/15 bg-black p-2">
                  <button type="button" onClick={() => void report(current.userId)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white/80 hover:bg-white/10"><SvjReportIcon className="h-4 w-4" />Report</button>
                  <button type="button" onClick={() => void takeAction("block", current.userId)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-white/80 hover:bg-white/10"><SvjBlockIcon className="h-4 w-4" />Block</button>
                </div>
              </details>
            </div>
          </>
        ) : null}
      </motion.main>
    </AnimatePresence>
  );
}

function SwipeCard({ card, onLike, onPass }: { card: MeetCard; onLike: () => void; onPass: () => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x > threshold) {
          onLike();
          return;
        }

        if (info.offset.x < -threshold) {
          onPass();
        }
      }}
      className="absolute inset-0 overflow-hidden rounded-3xl border border-white/15 bg-black/80"
    >
      <div className="relative h-[70%]">
        <img src={card.imageUrl} alt={card.displayName} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xl font-semibold">{card.displayName}, {card.age}</p>
        <p className="text-sm text-white/65">{card.city}</p>
        <div className="flex flex-wrap gap-2">{card.intentTags.map((tag) => <span key={tag} className="rounded-full border border-white/20 px-2.5 py-1 text-xs text-white/80">{tag}</span>)}</div>
        {card.bio ? <p className="text-sm text-white/70">{card.bio}</p> : null}
      </div>
    </motion.div>
  );
}

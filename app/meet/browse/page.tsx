"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { MeetShell, meetGhostButtonClass, meetPanelClass, meetPrimaryButtonClass, meetSecondaryPanelClass } from "@/components/meet/meet-shell";

type MeetCard = { id: string; userId: string; displayName: string; age: number; countryCode: string; city: string; bio: string | null; imageUrl: string; intentTags: string[] };
const THRESHOLD = 120;

function SwipeCard({ card, onLike, onPass }: { card: MeetCard; onLike: () => void; onPass: () => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-9, 9]);
  const likeOpacity = useTransform(x, [20, THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0]);
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x > THRESHOLD) onLike();
        if (info.offset.x < -THRESHOLD) onPass();
      }}
      className="absolute inset-0 cursor-grab overflow-hidden rounded-[34px] border border-white/12 bg-black active:cursor-grabbing"
    >
      {!imgErr ? (
        <img src={card.imageUrl} alt={card.displayName} onError={() => setImgErr(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2b0a13] to-black text-7xl font-semibold text-white/20">{card.displayName[0]}</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <motion.p className="absolute left-5 top-6 rounded-xl border border-emerald-300/60 bg-emerald-300/12 px-3 py-1 text-xs font-bold tracking-[0.12em] text-emerald-300" style={{ opacity: likeOpacity }}>REQUEST</motion.p>
      <motion.p className="absolute right-5 top-6 rounded-xl border border-red-300/60 bg-red-300/12 px-3 py-1 text-xs font-bold tracking-[0.12em] text-red-300" style={{ opacity: passOpacity }}>PASS</motion.p>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="text-4xl font-semibold tracking-tight">{card.displayName}, {card.age}</p>
        <p className="mt-1 text-sm text-white/65">{card.city}, {card.countryCode}</p>
        {card.bio && <p className="mt-2 line-clamp-2 text-sm text-white/75">{card.bio}</p>}
        {!!card.intentTags?.length && (
          <div className="mt-3 flex flex-wrap gap-2">
            {card.intentTags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-white/80">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function MeetBrowsePage() {
  const [queue, setQueue] = useState<MeetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const current = queue[0] ?? null;

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/meet/browse", { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { cards: MeetCard[] };
        setQueue(payload.cards);
      }
      setLoading(false);
    })();
  }, []);

  const doAction = async (action: "like" | "pass" | "block", userId: string) => {
    if (busy) return;
    setBusy(true);
    const endpoint = action === "like" ? "/api/meet/like" : action === "pass" ? "/api/meet/pass" : "/api/meet/block";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "block" ? { blockedUserId: userId } : { toUserId: userId }),
    });
    setQueue((items) => items.slice(1));
    setBusy(false);
  };

  return (
    <MeetShell eyebrow="Meet • Browse" title="Discover intentionally" subtitle="Premium card flow with explicit request controls." actions={<Link href="/meet/inbox" className={meetGhostButtonClass}>Inbox</Link>}>
      <div className="flex flex-1 flex-col gap-4">
        <div className={meetSecondaryPanelClass + " flex items-center justify-between p-3 text-xs text-white/60"}>
          <span>Queue size: {queue.length}</span>
          <span>Drag or use controls</span>
        </div>

        <div className="relative min-h-[560px] flex-1">
          <AnimatePresence mode="wait">
            {loading && <motion.div key="loading" className={`${meetPanelClass} absolute inset-0 flex items-center justify-center`}><p className="text-sm text-white/55">Loading candidates...</p></motion.div>}
            {!loading && !current && (
              <motion.div key="empty" className={`${meetPanelClass} absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center`}>
                <p className="text-2xl font-semibold tracking-tight">You are all caught up</p>
                <p className="text-sm text-white/60">No new cards right now. Check back soon.</p>
                <Link href="/meet" className={meetGhostButtonClass}>Back to Meet home</Link>
              </motion.div>
            )}
            {current && (
              <motion.div key={current.id} className="absolute inset-0" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <SwipeCard card={current} onLike={() => void doAction("like", current.userId)} onPass={() => void doAction("pass", current.userId)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={meetPanelClass + " p-3"}>
          <div className="grid grid-cols-5 gap-2">
            <button className={meetGhostButtonClass + " h-12 w-full rounded-2xl p-0"} onClick={() => current && void doAction("block", current.userId)} disabled={busy || !current}>⛔</button>
            <button className={meetGhostButtonClass + " h-12 w-full rounded-2xl p-0 text-lg"} onClick={() => current && void doAction("pass", current.userId)} disabled={busy || !current}>✕</button>
            <button className={meetPrimaryButtonClass + " h-12 w-full rounded-2xl p-0 text-lg"} onClick={() => current && void doAction("like", current.userId)} disabled={busy || !current}>❤</button>
            <button className={meetGhostButtonClass + " h-12 w-full rounded-2xl p-0 text-lg"} onClick={() => current && setQueue((items) => [...items.slice(1), items[0]])} disabled={busy || !current}>→</button>
            <Link href="/meet" className={meetGhostButtonClass + " h-12 w-full rounded-2xl p-0"}>⋯</Link>
          </div>
        </div>
      </div>
    </MeetShell>
  );
}

"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

type MeetCard = { id: string; userId: string; displayName: string; age: number; countryCode: string; city: string; bio: string | null; imageUrl: string; intentTags: string[] };

const THRESHOLD = 120;

const glassBtn: React.CSSProperties = {
background: "linear-gradient(160deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.03) 50%,rgba(0,0,0,0.08) 100%)",
border: "1px solid rgba(255,255,255,0.14)",
borderBottom: "1px solid rgba(255,255,255,0.04)",
boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1)",
color: "rgba(255,255,255,0.8)",
};

// ── SwipeCard ─────────────────────────────────────────────────────────────────

function SwipeCard({ card, onLike, onPass }: { card: MeetCard; onLike: () => void; onPass: () => void }) {
const x      = useMotionValue(0);
const rotate = useTransform(x, [-220, 220], [-9, 9]);
const likeOp = useTransform(x, [20, THRESHOLD], [0, 1]);
const passOp = useTransform(x, [-THRESHOLD, -20], [1, 0]);
const [imgErr, setImgErr] = useState(false);

return (
<motion.div
drag="x"
dragConstraints={{ left: 0, right: 0 }}
style={{ x, rotate, borderRadius: 26, boxShadow: "0 20px 60px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.07)" }}
onDragEnd={(_, info) => {
if (info.offset.x > THRESHOLD)  onLike();
if (info.offset.x < -THRESHOLD) onPass();
}}
className="absolute inset-0 cursor-grab select-none overflow-hidden active:cursor-grabbing"
>
{!imgErr ? (
<img src={card.imageUrl} alt={card.displayName} onError={() => setImgErr(true)} className="h-full w-full object-cover" />
) : (
<div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg,#0d0103,#3a0a14)" }}>
<span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 72, color: "rgba(255,255,255,0.2)" }}>{card.displayName[0]}</span>
</div>
)}

  {/* overlay */}
  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 42%,rgba(0,0,0,0.65) 72%,rgba(0,0,0,0.97) 100%)" }} />

  {/* drag indicators */}
  <motion.div className="pointer-events-none absolute left-5 top-7 rounded-[10px] px-4 py-2 text-[12px] font-bold tracking-[0.1em]"
    style={{ opacity: likeOp, color: "#4ade80", background: "rgba(74,222,128,0.12)", border: "1.5px solid rgba(74,222,128,0.5)" }}>LIKE</motion.div>
  <motion.div className="pointer-events-none absolute right-5 top-7 rounded-[10px] px-4 py-2 text-[12px] font-bold tracking-[0.1em]"
    style={{ opacity: passOp, color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1.5px solid rgba(248,113,113,0.45)" }}>PASS</motion.div>

  {/* card info */}
  <div className="absolute bottom-0 left-0 right-0 p-6">
    <p className="mb-1 text-[30px] leading-none text-white" style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-0.8px" }}>
      {card.displayName}, {card.age}
    </p>
    <div className="mb-3 flex items-center gap-2 text-[12.5px]" style={{ color: "rgba(255,255,255,0.5)" }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
      {card.city}
    </div>
    {card.bio && <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.58)" }}>{card.bio}</p>}
    {card.intentTags.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {card.intentTags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.65)", backdropFilter: "blur(10px)" }}>
            {tag}
          </span>
        ))}
      </div>
    )}
  </div>
</motion.div>

);
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function MeetBrowsePage() {
const [queue,   setQueue]   = useState<MeetCard[]>([]);
const [loading, setLoading] = useState(true);
const [busy,    setBusy]    = useState(false);
const current = queue[0] ?? null;

useEffect(() => {
void (async () => {
const r = await fetch("/api/meet/browse", { cache: "no-store" });
if (r.ok) {
const payload = (await r.json()) as { cards: MeetCard[] };
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
<motion.main
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.28, ease: "easeOut" }}
className="relative flex h-dvh w-full flex-col overflow-hidden text-white"
style={{ background: "#000", maxWidth: 430, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}
>
{/* ambient */}
<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
<div className="absolute rounded-full" style={{ left: "-15%", top: "20%", width: 200, height: 200, background: "rgba(90,16,32,0.1)", filter: "blur(100px)" }} />
</div>

  {/* header */}
  <div className="relative z-10 flex shrink-0 items-center justify-between px-5 pb-3 pt-6">
    <div className="flex items-center gap-3">
      <HeaderMenuDrawer />
      <Link href="/meet" className="flex h-9 w-9 items-center justify-center rounded-[12px] text-white/60 transition-all active:scale-90"
        style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(0,0,0,0.1) 100%)", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </Link>
      <span className="text-[15px] font-semibold" style={{ color: "rgba(232,232,232,0.65)" }}>Browse</span>
    </div>
    <div className="flex items-center gap-2.5">
      {queue.length > 0 && (
        <span className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(232,232,232,0.4)" }}>
          {queue.length} left
        </span>
      )}
      <Link href="/meet/inbox" className="flex h-9 items-center gap-1.5 rounded-[12px] px-3 text-[12px] font-semibold transition-all active:scale-95" style={glassBtn}>
        Inbox
      </Link>
    </div>
  </div>

  {/* card stack */}
  <div className="relative z-10 mx-4 min-h-0 flex-1">
    <div className="absolute inset-0" style={{ borderRadius: 26, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", transform: "scale(0.96) translateY(8px)" }} />
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center rounded-[26px]"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[13px]" style={{ color: "rgba(232,232,232,0.35)" }}>Loading...</p>
        </motion.div>
      )}
      {!loading && !current && (
        <motion.div key="empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[26px] p-8 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[22px]" style={{ fontFamily: "'Instrument Serif', serif", color: "rgba(255,255,255,0.4)" }}>All caught up</p>
          <p className="text-[13px]" style={{ color: "rgba(232,232,232,0.35)" }}>No more cards right now.</p>
        </motion.div>
      )}
      {current && (
        <motion.div key={current.id} className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.38, ease: [0.34, 1.15, 0.64, 1] }}>
          <SwipeCard card={current} onLike={() => void doAction("like", current.userId)} onPass={() => void doAction("pass", current.userId)} />
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  {/* action buttons */}
  <div className="relative z-10 flex shrink-0 items-center justify-center gap-4 px-5 py-5">
    {/* block */}
    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
      onClick={() => current && void doAction("block", current.userId)} disabled={busy || !current}
      className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-30"
      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(232,232,232,0.3)" }} aria-label="Block">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></svg>
    </motion.button>
    {/* pass */}
    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
      onClick={() => current && void doAction("pass", current.userId)} disabled={busy || !current}
      className="flex h-[54px] w-[54px] items-center justify-center rounded-full disabled:opacity-30"
      style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(0,0,0,0.08) 100%)", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.09),0 4px 16px rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.55)" }} aria-label="Pass">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </motion.button>
    {/* like */}
    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
      onClick={() => current && void doAction("like", current.userId)} disabled={busy || !current}
      className="flex h-[68px] w-[68px] items-center justify-center rounded-full disabled:opacity-30"
      style={{ background: "linear-gradient(160deg,rgba(120,25,48,0.95) 0%,rgba(65,10,24,0.92) 55%,rgba(30,4,12,0.97) 100%)", border: "1px solid rgba(150,40,65,0.28)", boxShadow: "inset 0 1.5px 0 rgba(220,80,110,0.2),0 8px 28px rgba(90,16,32,0.5),0 0 40px rgba(90,16,32,0.18)" }} aria-label="Like">
      <svg width="27" height="27" viewBox="0 0 24 24" fill="rgba(255,255,255,0.92)" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </motion.button>
    {/* skip */}
    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }}
      onClick={() => current && setQueue((q) => [...q.slice(1), q[0]])} disabled={busy || !current}
      className="flex h-[54px] w-[54px] items-center justify-center rounded-full disabled:opacity-30"
      style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(0,0,0,0.08) 100%)", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.09),0 4px 16px rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.55)" }} aria-label="Skip">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </motion.button>
    {/* more */}
    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} disabled={!current}
      className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-30"
      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(232,232,232,0.3)" }} aria-label="More">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
    </motion.button>
  </div>
</motion.main>

);
}

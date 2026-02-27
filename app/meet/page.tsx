“use client”;

import Link from “next/link”;
import { AnimatePresence, motion } from “framer-motion”;
import { useEffect, useState } from “react”;

type MeetCard = { displayName: string; city: string; imageUrl: string; intentTags?: string[] };

// ── glass helpers ─────────────────────────────────────────────────────────────

const glassStyle: React.CSSProperties = {
background: “linear-gradient(160deg,rgba(255,255,255,0.065) 0%,rgba(255,255,255,0.022) 45%,rgba(0,0,0,0.06) 100%)”,
border: “1px solid rgba(255,255,255,0.13)”,
borderBottom: “1px solid rgba(255,255,255,0.04)”,
borderRight: “1px solid rgba(255,255,255,0.04)”,
backdropFilter: “blur(50px) saturate(1.6)”,
boxShadow: “inset 0 1.5px 0 rgba(255,255,255,0.1),inset 0 -1px 0 rgba(0,0,0,0.15),0 4px 20px rgba(0,0,0,0.4)”,
};

const wineBtn: React.CSSProperties = {
background: “linear-gradient(160deg,rgba(120,25,48,0.95) 0%,rgba(65,10,24,0.92) 55%,rgba(30,4,12,0.97) 100%)”,
border: “1px solid rgba(150,40,65,0.28)”,
borderBottom: “1px solid rgba(0,0,0,0.4)”,
boxShadow: “inset 0 1.5px 0 rgba(220,80,110,0.2),0 4px 16px rgba(0,0,0,0.4)”,
color: “rgba(255,255,255,0.9)”,
};

const glassBtn: React.CSSProperties = {
background: “linear-gradient(160deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.03) 50%,rgba(0,0,0,0.08) 100%)”,
border: “1px solid rgba(255,255,255,0.14)”,
borderBottom: “1px solid rgba(255,255,255,0.04)”,
boxShadow: “inset 0 1.5px 0 rgba(255,255,255,0.1)”,
color: “rgba(255,255,255,0.8)”,
};

// ── component ─────────────────────────────────────────────────────────────────

export default function MeetPage() {
const [loading, setLoading] = useState(true);
const [card,    setCard]    = useState<MeetCard | null>(null);
const [imgErr,  setImgErr]  = useState(false);

useEffect(() => {
void (async () => {
const r = await fetch(”/api/meet/card”, { cache: “no-store” });
if (r.ok) {
const payload = (await r.json()) as { card: MeetCard | null };
setCard(payload.card);
}
setLoading(false);
})();
}, []);

return (
<AnimatePresence mode="wait">
<motion.main
key={loading ? “loading” : card ? “ready” : “create”}
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -10 }}
transition={{ duration: 0.28, ease: “easeOut” }}
className=“relative flex min-h-screen w-full flex-col overflow-hidden pb-16 text-white”
style={{ background: “#000”, fontFamily: “‘DM Sans’, sans-serif” }}
>
{/* ── animated blobs ── */}
<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
<motion.div
animate={{ x: [0, 30, 0], y: [0, 40, 0], scale: [1, 1.12, 1] }}
transition={{ duration: 12, repeat: Infinity, repeatType: “mirror”, ease: “easeInOut” }}
className=“absolute rounded-full”
style={{ left: “-20%”, top: “8%”, width: 320, height: 320, background: “rgba(90,16,32,0.18)”, filter: “blur(90px)” }}
/>
<motion.div
animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 0.9, 1] }}
transition={{ duration: 16, repeat: Infinity, repeatType: “mirror”, ease: “easeInOut” }}
className=“absolute rounded-full”
style={{ right: “-25%”, top: “25%”, width: 280, height: 280, background: “rgba(90,16,32,0.1)”, filter: “blur(110px)” }}
/>
<motion.div
animate={{ x: [0, 20, 0], y: [0, -35, 0], scale: [1, 1.08, 1] }}
transition={{ duration: 20, repeat: Infinity, repeatType: “mirror”, ease: “easeInOut” }}
className=“absolute rounded-full”
style={{ left: “10%”, bottom: “15%”, width: 240, height: 240, background: “rgba(255,255,255,0.03)”, filter: “blur(120px)” }}
/>
</div>

```
    {/* ── header ── */}
    <header className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between px-5 pt-6">
      <span className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.25)" }}>
        Vexa
      </span>
      <Link
        href="/meet/inbox"
        className="inline-flex h-9 items-center gap-2 rounded-[14px] px-4 text-[12px] font-semibold transition-all active:scale-95"
        style={glassBtn}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          <path d="M16 19h6M19 16v6"/>
        </svg>
        Inbox
      </Link>
    </header>

    {/* ── body ── */}
    <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5">

      {/* headline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.05 }}
        className="mb-8"
      >
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>
          Meet · Request-based matching
        </p>
        <h1
          className="mb-3 leading-[1.04] text-white"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 48, letterSpacing: "-1.4px", fontWeight: 400 }}
        >
          Find your<br />
          <span style={{ color: "rgba(255,255,255,0.28)" }}>people.</span>
        </h1>
        <p className="text-[13.5px] leading-relaxed" style={{ color: "rgba(232,232,232,0.55)" }}>
          Send requests. Wait for acceptance.<br />Matches only after both agree.
        </p>
      </motion.div>

      {/* card preview / loading / create */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.34, 1.15, 0.64, 1], delay: 0.1 }}
      >
        {loading && (
          <div className="flex items-center justify-center rounded-[22px] py-16" style={glassStyle}>
            <p className="text-[13px]" style={{ color: "rgba(232,232,232,0.35)" }}>Loading…</p>
          </div>
        )}

        {!loading && !card && (
          <div className="rounded-[22px] px-6 py-8" style={glassStyle}>
            <p className="mb-5 text-[14px]" style={{ color: "rgba(232,232,232,0.65)" }}>
              Create your card to join Meet.
            </p>
            <Link
              href="/meet/create"
              className="inline-flex h-11 items-center gap-2 rounded-[14px] px-5 text-[13.5px] font-semibold transition-all active:scale-95"
              style={wineBtn}
            >
              Create card
            </Link>
          </div>
        )}

        {!loading && card && (
          <div>
            {/* photo card */}
            <div
              className="relative mb-5 h-56 overflow-hidden rounded-[22px]"
              style={{ border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
            >
              {!imgErr ? (
                <img src={card.imageUrl} alt={card.displayName} onError={() => setImgErr(true)} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center" style={{ background: "linear-gradient(135deg,#0d0103,#3a0a14)" }}>
                  <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 48, color: "rgba(255,255,255,0.25)" }}>{card.displayName[0]}</span>
                </div>
              )}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.88) 100%)" }} />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-5">
                <div>
                  <p className="text-[20px] text-white" style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: "-0.4px" }}>
                    {card.displayName}
                  </p>
                  <p className="mt-0.5 text-[12px]" style={{ color: "rgba(255,255,255,0.5)" }}>{card.city}</p>
                </div>
                {card.intentTags && (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {card.intentTags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                        style={{ background: "rgba(90,16,32,0.35)", border: "1px solid rgba(138,31,56,0.3)", color: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* actions */}
            <div className="flex flex-wrap gap-3">
              <Link href="/meet/browse" className="inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3 text-[13.5px] font-semibold transition-all active:scale-95" style={wineBtn}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
                Browse
              </Link>
              <Link href="/meet/inbox" className="inline-flex items-center justify-center rounded-[14px] px-5 py-3 text-[13.5px] font-semibold transition-all active:scale-95" style={glassBtn}>
                Inbox
              </Link>
              <Link href="/meet/create" className="inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-[13.5px] font-semibold transition-all active:scale-95" style={glassBtn}>
                Edit card
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  </motion.main>
</AnimatePresence>
```

);
}

"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

type MeetCard = {
  displayName: string;
  city: string;
  imageUrl: string;
  intentTags?: string[];
};

const shellGlass: React.CSSProperties = {
  background:
    "linear-gradient(155deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 38%, rgba(8,8,12,0.46) 100%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.03), 0 22px 60px rgba(0,0,0,0.55)",
  backdropFilter: "blur(22px) saturate(1.45)",
};

const primaryBtn: React.CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(240,88,166,0.98) 0%, rgba(130,86,255,0.96) 52%, rgba(89,55,215,0.97) 100%)",
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 14px 34px rgba(127, 73, 255, 0.38), inset 0 1px 0 rgba(255,255,255,0.35)",
  color: "rgba(255,255,255,0.98)",
};

const ghostBtn: React.CSSProperties = {
  background:
    "linear-gradient(155deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "rgba(255,255,255,0.86)",
};

const sectionLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.64)",
  letterSpacing: "0.18em",
};

export default function MeetPage() {
  const [loading, setLoading] = useState(true);
  const [card, setCard] = useState<MeetCard | null>(null);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/meet/card", { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as { card: MeetCard | null };
        setCard(payload.card);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={loading ? "loading" : card ? "ready" : "create"}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative flex min-h-screen w-full flex-col overflow-hidden pb-16 text-white"
        style={{ background: "#050507", fontFamily: "Inter, 'DM Sans', sans-serif" }}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute -left-24 top-4 h-72 w-72 rounded-full"
            style={{ background: "rgba(202,87,251,0.22)", filter: "blur(105px)" }}
          />
          <div
            className="absolute -right-24 top-24 h-80 w-80 rounded-full"
            style={{ background: "rgba(56,189,248,0.16)", filter: "blur(115px)" }}
          />
          <div
            className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full"
            style={{ background: "rgba(244,114,182,0.16)", filter: "blur(120px)" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)]" />
        </div>

        <header className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between px-5 pt-6">
          <div className="flex items-center gap-3">
            <HeaderMenuDrawer />
            <span className="text-[10px] font-semibold uppercase" style={sectionLabel}>
              Meet Space
            </span>
          </div>
          <Link
            href="/meet/inbox"
            className="inline-flex h-9 items-center gap-2 rounded-[14px] px-4 text-[12px] font-semibold transition active:scale-95"
            style={ghostBtn}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              <path d="M16 19h6M19 16v6" />
            </svg>
            Inbox
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.04 }}
            className="mb-8"
          >
            <p className="mb-3 text-[10px] font-semibold uppercase" style={sectionLabel}>
              Curated, consent-first matching
            </p>
            <h1 className="mb-3 text-[42px] font-semibold leading-[0.98] tracking-[-0.03em] text-white sm:text-[50px]">
              Meet people who
              <br />
              <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
                match your vibe.
              </span>
            </h1>
            <p className="max-w-md text-[14px] leading-relaxed text-white/70">
              Discover profiles, send intentional requests, and connect only after mutual acceptance.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.36, ease: [0.34, 1.15, 0.64, 1], delay: 0.08 }}
          >
            {loading && (
              <div className="rounded-[26px] px-6 py-16 text-center" style={shellGlass}>
                <p className="text-[13px] text-white/55">Preparing your Meet space…</p>
              </div>
            )}

            {!loading && !card && (
              <div className="rounded-[26px] px-6 py-8" style={shellGlass}>
                <p className="mb-5 text-[14px] leading-relaxed text-white/75">
                  Create your card to unlock Meet and start receiving high-quality requests.
                </p>
                <Link
                  href="/meet/create"
                  className="inline-flex h-11 items-center gap-2 rounded-[14px] px-5 text-[13.5px] font-semibold transition active:scale-95"
                  style={primaryBtn}
                >
                  Create your card
                </Link>
              </div>
            )}

            {!loading && card && (
              <div>
                <div
                  className="relative mb-5 h-60 overflow-hidden rounded-[26px]"
                  style={{
                    border: "1px solid rgba(255,255,255,0.16)",
                    boxShadow: "0 18px 48px rgba(0,0,0,0.58)",
                  }}
                >
                  {!imgErr ? (
                    <img
                      src={card.imageUrl}
                      alt={card.displayName}
                      onError={() => setImgErr(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: "linear-gradient(135deg,#1f1239,#4f1f7a,#1d4f75)" }}
                    >
                      <span className="text-5xl font-semibold text-white/45">{card.displayName[0]}</span>
                    </div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg,transparent 36%,rgba(2,3,10,0.94) 100%)" }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-5">
                    <div>
                      <p className="text-[21px] font-semibold tracking-tight text-white">{card.displayName}</p>
                      <p className="mt-0.5 text-[12px] text-white/70">{card.city}</p>
                    </div>
                    {card.intentTags && card.intentTags.length > 0 && (
                      <div className="flex max-w-[52%] flex-wrap justify-end gap-1.5">
                        {card.intentTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/90 backdrop-blur-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/meet/browse"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3 text-[13.5px] font-semibold transition active:scale-95"
                    style={primaryBtn}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                    Explore profiles
                  </Link>
                  <Link
                    href="/meet/inbox"
                    className="inline-flex items-center justify-center rounded-[14px] px-5 py-3 text-[13.5px] font-semibold transition active:scale-95"
                    style={ghostBtn}
                  >
                    Inbox
                  </Link>
                  <Link
                    href="/meet/create"
                    className="inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-[13.5px] font-semibold transition active:scale-95"
                    style={ghostBtn}
                  >
                    Edit card
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.main>
    </AnimatePresence>
  );
}

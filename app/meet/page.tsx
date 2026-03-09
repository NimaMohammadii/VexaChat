"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MeetShell, meetGhostButtonClass, meetPanelClass, meetPrimaryButtonClass, meetSecondaryPanelClass } from "@/components/meet/meet-shell";

type MeetCard = { displayName: string; city: string; imageUrl: string; intentTags?: string[] };

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
    <MeetShell
      eyebrow="Meet • Request-only"
      title={<>Curated, consent-first connections.</>}
      subtitle="Private discovery with stronger trust signals and clear control over every interaction."
      actions={
        <Link href="/meet/inbox" className={meetGhostButtonClass}>
          Inbox
        </Link>
      }
    >
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }} className="space-y-4">
        <section className={`${meetPanelClass} p-5`}>
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Privacy</p>
              <p className="mt-1 text-sm font-medium">Request gated</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Flow</p>
              <p className="mt-1 text-sm font-medium">Card-first</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">State</p>
              <p className="mt-1 text-sm font-medium">{loading ? "Loading" : card ? "Active" : "Setup"}</p>
            </div>
          </div>
        </section>

        {loading && (
          <div className={`${meetPanelClass} flex items-center justify-center py-16`}>
            <p className="text-sm text-white/55">Loading your profile card...</p>
          </div>
        )}

        {!loading && !card && (
          <div className={`${meetPanelClass} p-6`}>
            <p className="text-xl font-semibold tracking-tight">Build your profile to unlock Meet</p>
            <p className="mt-2 text-sm text-white/65">Create your card once, then browse and send requests with full control.</p>
            <div className="mt-5 flex">
              <Link href="/meet/create" className={meetPrimaryButtonClass}>
                Create card
              </Link>
            </div>
          </div>
        )}

        {!loading && card && (
          <>
            <article className="relative overflow-hidden rounded-[34px] border border-white/12 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
              {!imgErr ? (
                <img src={card.imageUrl} alt={card.displayName} onError={() => setImgErr(true)} className="h-80 w-full object-cover" />
              ) : (
                <div className="flex h-80 w-full items-center justify-center bg-gradient-to-br from-[#1f0a10] to-black">
                  <span className="text-7xl font-semibold text-white/25">{card.displayName[0]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-4xl font-semibold tracking-tight">{card.displayName}</p>
                <p className="mt-1 text-sm text-white/65">{card.city}</p>
                {!!card.intentTags?.length && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.intentTags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs text-white/85">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <div className={`${meetSecondaryPanelClass} grid grid-cols-1 gap-2.5 p-3`}>
              <Link href="/meet/browse" className={meetPrimaryButtonClass}>
                Browse people
              </Link>
              <div className="grid grid-cols-2 gap-2.5">
                <Link href="/meet/inbox" className={meetGhostButtonClass}>
                  Open inbox
                </Link>
                <Link href="/meet/create" className={meetGhostButtonClass}>
                  Edit card
                </Link>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </MeetShell>
  );
}

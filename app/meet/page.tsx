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
      title={<>Find people who match your pace.</>}
      subtitle="Send a request, wait for consent, and only connect when both sides agree."
      actions={
        <Link href="/meet/inbox" className={meetGhostButtonClass}>
          Inbox
        </Link>
      }
    >
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-8 space-y-4">
        {loading && (
          <div className={`${meetPanelClass} flex items-center justify-center py-16`}>
            <p className="text-sm text-white/55">Loading card...</p>
          </div>
        )}

        {!loading && !card && (
          <div className={`${meetPanelClass} p-6`}>
            <p className="text-sm text-white/70">Create your profile card to unlock browsing and requests.</p>
            <div className="mt-5 flex">
              <Link href="/meet/create" className={meetPrimaryButtonClass}>
                Create card
              </Link>
            </div>
          </div>
        )}

        {!loading && card && (
          <>
            <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_14px_55px_rgba(0,0,0,0.55)]">
              {!imgErr ? (
                <img src={card.imageUrl} alt={card.displayName} onError={() => setImgErr(true)} className="h-72 w-full object-cover" />
              ) : (
                <div className="flex h-72 w-full items-center justify-center bg-gradient-to-br from-[#1f0a10] to-black">
                  <span className="text-6xl font-semibold text-white/25">{card.displayName[0]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-3xl font-semibold tracking-tight">{card.displayName}</p>
                <p className="mt-1 text-sm text-white/65">{card.city}</p>
                {!!card.intentTags?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {card.intentTags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs text-white/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>

            <div className={`${meetSecondaryPanelClass} p-4`}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Link href="/meet/browse" className={meetPrimaryButtonClass}>
                  Browse
                </Link>
                <Link href="/meet/inbox" className={meetGhostButtonClass}>
                  Inbox
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

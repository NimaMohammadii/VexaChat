"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Card = {
  userId: string;
  displayName: string;
  age: number;
  city: string;
  bio?: string | null;
  questionPrompt?: string | null;
  answer?: string | null;
  imageUrls: string[];
};

export function MeetBrowseStack() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const loadCards = async () => {
    setLoading(true);
    const response = await fetch("/api/meet/browse", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Unable to load cards.");
      setCards([]);
      setLoading(false);
      return;
    }
    setCards(payload.cards);
    setLoading(false);
  };

  useEffect(() => {
    void loadCards();
  }, []);

  const act = async (action: "like" | "pass" | "follow", toUserId: string) => {
    const response = await fetch(`/api/meet/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId })
    });
    if (!response.ok) return;
    setCards((current) => current.slice(1));
  };

  const report = async (reportedUserId: string) => {
    await fetch("/api/meet/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedUserId, reason: "Inappropriate content" })
    });
  };

  const block = async (blockedUserId: string) => {
    await fetch("/api/meet/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockedUserId })
    });
    setCards((current) => current.slice(1));
  };

  const top = cards[0];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Browse Meet Cards</h1>
      </div>
      {status ? <p className="text-sm text-amber-300">{status}</p> : null}
      {loading ? <div className="bw-card h-[500px] animate-pulse" /> : null}
      {!loading && !top ? <div className="bw-card p-6 text-sm text-white/70">No more users nearby. Adjust filters.</div> : null}

      <AnimatePresence>
        {top ? (
          <motion.article
            key={top.userId}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -120) void act("pass", top.userId);
              if (info.offset.x > 120) void act("like", top.userId);
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bw-card overflow-hidden"
          >
            <div className="relative h-[420px] w-full bg-black/40">
              {top.imageUrls[0] ? <img src={top.imageUrls[0]} alt={top.displayName} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="space-y-2 p-5">
              <h2 className="text-xl font-semibold">{top.displayName}, {top.age}</h2>
              <p className="text-sm text-white/70">{top.city}</p>
              {top.bio ? <p className="text-sm text-white/80">{top.bio}</p> : null}
              {top.questionPrompt && top.answer ? <p className="text-sm text-white/70">{top.questionPrompt}: <span className="text-white">{top.answer}</span></p> : null}
              <div className="flex flex-wrap gap-2 pt-2">
                <button aria-label="Pass" className="bw-button-muted" onClick={() => void act("pass", top.userId)}>✕ Pass</button>
                <button aria-label="Like" className="bw-button" onClick={() => void act("like", top.userId)}>♥ Like</button>
                <button aria-label="Follow" className="bw-button-muted" onClick={() => void act("follow", top.userId)}>＋ Follow</button>
                <button aria-label="Message" className="bw-button-muted" onClick={() => setStatus("Message threads coming soon.")}>Message</button>
                <button aria-label="Report" className="bw-button-muted" onClick={() => void report(top.userId)}>Report</button>
                <button aria-label="Block" className="bw-button-muted" onClick={() => void block(top.userId)}>Block</button>
              </div>
            </div>
          </motion.article>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

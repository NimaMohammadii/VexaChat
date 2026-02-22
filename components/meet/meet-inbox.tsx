"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type InboxPayload = {
  incoming: Array<{ id: string; fromUserId: string; createdAt: string }>;
  outgoing: Array<{ id: string; toUserId: string; status: string }>;
  matches: Array<{ id: string; userLowId: string; userHighId: string }>;
  cardByUser: Record<string, { displayName: string; city: string }>;
  currentUserId: string;
};

export function MeetInbox() {
  const [data, setData] = useState<InboxPayload | null>(null);

  const load = async () => {
    const response = await fetch("/api/meet/inbox", { cache: "no-store" });
    if (!response.ok) return;
    setData((await response.json()) as InboxPayload);
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (requestId: string, action: "accept" | "reject") => {
    await fetch(`/api/meet/requests/${requestId}/${action}`, { method: "POST" });
    void load();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-black px-4 py-12 text-white">
      <h1 className="text-3xl font-semibold">Inbox</h1>
      <section className="bw-card space-y-3 p-5">
        <p className="text-sm text-white/60">Incoming requests</p>
        {data?.incoming.length ? data.incoming.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between rounded-xl border border-white/15 p-3">
            <span>{data.cardByUser[item.fromUserId]?.displayName ?? "Unknown"}</span>
            <div className="flex gap-2"><button className="bw-button" onClick={() => void act(item.id, "accept")}>Accept</button><button className="bw-button-muted" onClick={() => void act(item.id, "reject")}>Reject</button></div>
          </motion.div>
        )) : <p className="text-sm text-white/65">No pending requests.</p>}
      </section>
      <section className="bw-card space-y-3 p-5">
        <p className="text-sm text-white/60">Outgoing</p>
        {data?.outgoing.map((item) => <p key={item.id} className="text-sm">{data.cardByUser[item.toUserId]?.displayName ?? "Unknown"} — {item.status}</p>)}
      </section>
      <section className="bw-card space-y-3 p-5">
        <p className="text-sm text-white/60">Matches</p>
        {data?.matches.map((item) => {
          const otherId = item.userLowId === data.currentUserId ? item.userHighId : item.userLowId;
          return <p key={item.id} className="text-sm">{data.cardByUser[otherId]?.displayName ?? "Match"}</p>;
        })}
      </section>
    </main>
  );
}

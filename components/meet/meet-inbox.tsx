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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 bg-[#060609] px-4 py-12 text-white">
      <h1 className="text-3xl font-semibold tracking-tight">Inbox</h1>
      <section className="space-y-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-white/55">Incoming requests</p>
        {data?.incoming.length ? data.incoming.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-3">
            <span>{data.cardByUser[item.fromUserId]?.displayName ?? "Unknown"}</span>
            <div className="flex gap-2"><button className="rounded-xl border border-white/10 bg-white px-3 py-1.5 text-xs font-semibold text-black" onClick={() => void act(item.id, "accept")}>Accept</button><button className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs" onClick={() => void act(item.id, "reject")}>Reject</button></div>
          </motion.div>
        )) : <p className="text-sm text-white/65">No pending requests.</p>}
      </section>
    </main>
  );
}

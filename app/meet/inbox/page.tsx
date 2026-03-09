"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MeetShell, meetGhostButtonClass, meetPanelClass, meetPrimaryButtonClass, meetSecondaryPanelClass } from "@/components/meet/meet-shell";

type InboxPayload = {
  incoming: Array<{ id: string; fromUserId: string; createdAt: string }>;
  outgoing: Array<{ id: string; toUserId: string; status: string }>;
  matches: Array<{ id: string; userLowId: string; userHighId: string }>;
  cardByUser: Record<string, { displayName: string; city: string }>;
  currentUserId: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function MeetInboxPage() {
  const router = useRouter();
  const [data, setData] = useState<InboxPayload | null>(null);

  const load = async () => {
    const response = await fetch("/api/meet/inbox", { cache: "no-store" });
    if (response.ok) setData((await response.json()) as InboxPayload);
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (requestId: string, action: "accept" | "reject") => {
    await fetch(`/api/meet/requests/${requestId}/${action}`, { method: "POST" });
    void load();
  };

  const openChat = async (userId: string) => {
    const response = await fetch("/api/chats/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: userId }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { conversation: { id: string } };
    router.push(`/chats/${payload.conversation.id}`);
  };

  return (
    <MeetShell eyebrow="Meet • Inbox" title="Requests and matches" subtitle="A cleaner command center for approvals and conversations." actions={<Link href="/meet" className={meetGhostButtonClass}>Home</Link>}>
      <div className="space-y-4 pb-5">
        <section className={meetPanelClass + " p-4"}>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Incoming</p>
              <p className="mt-1 text-lg font-semibold">{data?.incoming.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Matches</p>
              <p className="mt-1 text-lg font-semibold">{data?.matches.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-white/45">Sent</p>
              <p className="mt-1 text-lg font-semibold">{data?.outgoing.length ?? 0}</p>
            </div>
          </div>
        </section>

        <section className={meetPanelClass + " p-4"}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.14em] text-white/50">Incoming requests</p>
          </div>
          <div className="space-y-2.5">
            {data && !data.incoming.length && <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/55">No pending requests.</p>}
            {data?.incoming.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={meetSecondaryPanelClass + " flex items-center justify-between gap-3 p-3"}>
                <div>
                  <p className="text-sm font-medium">{data.cardByUser[item.fromUserId]?.displayName ?? "Unknown"}</p>
                  <p className="text-xs text-white/55">{data.cardByUser[item.fromUserId]?.city ?? ""} • {timeAgo(item.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => void act(item.id, "accept")} className={meetPrimaryButtonClass + " px-4 py-2 text-xs"}>Accept</button>
                  <button onClick={() => void act(item.id, "reject")} className={meetGhostButtonClass + " px-4 py-2 text-xs"}>Reject</button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className={meetPanelClass + " p-4"}>
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-white/50">Matches</p>
          <div className="space-y-2.5">
            {data && !data.matches.length && <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/55">No matches yet.</p>}
            {data?.matches.map((item) => {
              const otherId = item.userLowId === data.currentUserId ? item.userHighId : item.userLowId;
              const other = data.cardByUser[otherId];
              return (
                <div key={item.id} className={meetSecondaryPanelClass + " flex items-center justify-between p-3"}>
                  <div>
                    <p className="text-sm font-medium">{other?.displayName ?? "Match"}</p>
                    <p className="text-xs text-white/55">{other?.city ?? ""}</p>
                  </div>
                  <button onClick={() => void openChat(otherId)} className={meetGhostButtonClass + " px-4 py-2 text-xs"}>Message</button>
                </div>
              );
            })}
          </div>
        </section>

        <section className={meetPanelClass + " p-4"}>
          <p className="mb-3 text-xs uppercase tracking-[0.14em] text-white/50">Sent requests</p>
          <div className="space-y-2.5">
            {data && !data.outgoing.length && <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/55">No sent requests.</p>}
            {data?.outgoing.map((item) => (
              <div key={item.id} className={meetSecondaryPanelClass + " flex items-center justify-between p-3"}>
                <div>
                  <p className="text-sm font-medium">{data.cardByUser[item.toUserId]?.displayName ?? "Unknown"}</p>
                  <p className="text-xs text-white/55">{data.cardByUser[item.toUserId]?.city ?? ""}</p>
                </div>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.08em] text-white/65">{item.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MeetShell>
  );
}

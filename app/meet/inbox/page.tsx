"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type InboxPayload = {
incoming: Array<{ id: string; fromUserId: string; createdAt: string }>;
outgoing: Array<{ id: string; toUserId: string; status: string }>;
matches:  Array<{ id: string; userLowId: string; userHighId: string }>;
cardByUser: Record<string, { displayName: string; city: string }>;
currentUserId: string;
};

// ── helpers ───────────────────────────────────────────────────────────────────

const glassCard: React.CSSProperties = {
background: "linear-gradient(160deg,rgba(255,255,255,0.065) 0%,rgba(255,255,255,0.022) 45%,rgba(0,0,0,0.06) 100%)",
border: "1px solid rgba(255,255,255,0.13)",
borderBottom: "1px solid rgba(255,255,255,0.04)",
backdropFilter: "blur(50px) saturate(1.6)",
boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1)",
};

const GRADIENTS = [
"linear-gradient(135deg,#0d0103,#3a0a14)",
"linear-gradient(135deg,#04080f,#0e1726)",
"linear-gradient(135deg,#030d05,#0c1c0e)",
"linear-gradient(135deg,#07041a,#150e30)",
];
function getBg(id: string) {
let h = 0;
for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

function timeAgo(iso: string) {
const diff = Date.now() - new Date(iso).getTime();
if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
return `${Math.floor(diff / 86400000)}d ago`;
}

function Avatar({ id, name }: { id: string; name: string }) {
return (
<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] text-[15px] font-semibold"
style={{ background: getBg(id), border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)" }}>
{(name?.[0] ?? "?").toUpperCase()}
</div>
);
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function MeetInboxPage() {
const router = useRouter();
const [data, setData] = useState<InboxPayload | null>(null);

const load = async () => {
const r = await fetch("/api/meet/inbox", { cache: "no-store" });
if (r.ok) setData((await r.json()) as InboxPayload);
};

useEffect(() => { void load(); }, []);

const act = async (requestId: string, action: "accept" | "reject") => {
await fetch(`/api/meet/requests/${requestId}/${action}`, { method: "POST" });
void load();
};

const openChat = async (userId: string) => {
const r = await fetch("/api/chats/open", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ otherUserId: userId }),
});
if (!r.ok) return;
const payload = (await r.json()) as { conversation: { id: string } };
router.push(`/chats/${payload.conversation.id}`);
};

const spring = { duration: 0.38, ease: [0.34, 1.15, 0.64, 1] as const };

return (
<motion.main
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.28, ease: "easeOut" }}
className="relative min-h-screen w-full overflow-hidden pb-20 text-white"
style={{ background: "#000", fontFamily: "'DM Sans', sans-serif" }}
>
{/* ambient */}
<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
<div className="absolute rounded-full" style={{ right: "-20%", top: "15%", width: 220, height: 220, background: "rgba(90,16,32,0.1)", filter: "blur(110px)" }} />
</div>

  <div className="relative z-10 mx-auto max-w-xl px-5">

    {/* header */}
    <div className="flex items-center justify-between pt-6">
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.28)" }}>Meet</p>
        <h1 className="leading-none text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 32, letterSpacing: "-1.2px", fontWeight: 400 }}>
          Inbox
        </h1>
      </div>
      <Link href="/meet" className="flex h-9 w-9 items-center justify-center rounded-[12px] text-white/60 transition-all active:scale-90"
        style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(0,0,0,0.1) 100%)", border: "1px solid rgba(255,255,255,0.13)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      </Link>
    </div>

    <div className="mt-8 flex flex-col gap-8">

      {/* ── incoming ── */}
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(232,232,232,0.35)" }}>
          Incoming{data?.incoming.length ? ` · ${data.incoming.length}` : ""}
        </p>
        <div className="flex flex-col gap-2.5">
          {!data && <p className="text-[13px]" style={{ color: "rgba(232,232,232,0.35)" }}>Loading...</p>}
          {data && !data.incoming.length && (
            <div className="flex items-center justify-center rounded-[18px] py-10" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[13px]" style={{ color: "rgba(232,232,232,0.28)" }}>No pending requests</p>
            </div>
          )}
          {data?.incoming.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-[18px] p-3.5" style={glassCard}>
              <Avatar id={item.fromUserId} name={data.cardByUser[item.fromUserId]?.displayName ?? "?"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-white">{data.cardByUser[item.fromUserId]?.displayName ?? "Unknown"}</p>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "rgba(232,232,232,0.38)" }}>
                  {data.cardByUser[item.fromUserId]?.city} · {timeAgo(item.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <motion.button whileTap={{ scale: 0.94 }} onClick={() => void act(item.id, "accept")}
                  className="h-8 rounded-[9px] px-3.5 text-[12px] font-semibold"
                  style={{ background: "linear-gradient(160deg,rgba(90,16,32,0.65) 0%,rgba(50,8,18,0.55) 100%)", border: "1px solid rgba(138,31,56,0.28)", boxShadow: "inset 0 1.5px 0 rgba(138,31,56,0.18)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans', sans-serif" }}>
                  Accept
                </motion.button>
                <motion.button whileTap={{ scale: 0.94 }} onClick={() => void act(item.id, "reject")}
                  className="flex h-8 w-8 items-center justify-center rounded-[9px]"
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(232,232,232,0.35)" }} aria-label="Reject">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* ── matches ── */}
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(232,232,232,0.35)" }}>
          Matches{data?.matches.length ? ` · ${data.matches.length}` : ""}
        </p>
        <div className="flex flex-col gap-2.5">
          {data && !data.matches.length && (
            <div className="flex items-center justify-center rounded-[18px] py-10" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-[13px]" style={{ color: "rgba(232,232,232,0.28)" }}>No matches yet</p>
            </div>
          )}
          {data?.matches.map((item, i) => {
            const otherId = item.userLowId === data.currentUserId ? item.userHighId : item.userLowId;
            const other   = data.cardByUser[otherId];
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.05 }}
                className="relative flex items-center gap-3 overflow-hidden rounded-[18px] p-3.5" style={glassCard}>
                <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(135deg,rgba(90,16,32,0.1) 0%,transparent 60%)" }} />
                <span className="absolute right-3 top-2.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                  style={{ background: "rgba(90,16,32,0.15)", border: "1px solid rgba(90,16,32,0.2)", color: "rgba(138,31,56,0.8)" }}>Match</span>
                <Avatar id={otherId} name={other?.displayName ?? "?"} />
                <div className="relative min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-white">{other?.displayName ?? "Match"}</p>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: "rgba(232,232,232,0.38)" }}>{other?.city ?? ""} · You both liked each other</p>
                </div>
                <motion.button whileTap={{ scale: 0.94 }} onClick={() => void openChat(otherId)}
                  className="relative h-8 shrink-0 rounded-[9px] px-3 text-[12px] font-semibold"
                  style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.03) 50%,rgba(0,0,0,0.08) 100%)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif" }}>
                  Message
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

      {/* ── sent ── */}
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(232,232,232,0.35)" }}>Sent</p>
        <div className="flex flex-col gap-2.5">
          {data && !data.outgoing.length && (
            <p className="text-[13px]" style={{ color: "rgba(232,232,232,0.28)" }}>No sent requests</p>
          )}
          {data?.outgoing.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-[18px] p-3.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Avatar id={item.toUserId} name={data.cardByUser[item.toUserId]?.displayName ?? "?"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-white">{data.cardByUser[item.toUserId]?.displayName ?? "Unknown"}</p>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "rgba(232,232,232,0.38)" }}>{data.cardByUser[item.toUserId]?.city}</p>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-medium"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(232,232,232,0.35)" }}>
                {item.status}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  </div>
</motion.main>

);
}

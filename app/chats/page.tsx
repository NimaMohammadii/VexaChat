“use client”;

// app/chats/page.tsx
// Redesigned UI — liquid glass dark theme, same logic & APIs as before.
// APIs: GET /api/chats/list · GET /api/chats/search · POST /api/chats/open

import { AnimatePresence, motion } from “framer-motion”;
import { useEffect, useMemo, useState } from “react”;
import { useRouter } from “next/navigation”;
import { HeaderMenuDrawer } from “@/components/header-menu-drawer”;

type SearchUser = { id: string; username: string; avatarUrl: string; bio: string };
type ConversationRow = {
id: string;
friendUser: { id: string; username: string; avatarUrl: string };
lastMessage: { text: string; createdAt: string } | null;
expiresAt: string;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function daysLeft(expiresAt: string) {
const diff = new Date(expiresAt).getTime() - Date.now();
return Math.max(0, Math.ceil(diff / 86400000));
}

function timeAgo(iso: string) {
const diff = Date.now() - new Date(iso).getTime();
if (diff < 60000)  return “just now”;
if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
return `${Math.floor(diff / 86400000)}d ago`;
}

const GRADIENTS = [
“linear-gradient(135deg,#0d0103,#3a0a14)”,
“linear-gradient(135deg,#04080f,#0e1726)”,
“linear-gradient(135deg,#030d05,#0c1c0e)”,
“linear-gradient(135deg,#0d0802,#241804)”,
“linear-gradient(135deg,#07041a,#150e30)”,
];
function getBg(id: string) {
let h = 0;
for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ id, username, avatarUrl, size = “h-11 w-11” }: { id: string; username: string; avatarUrl: string; size?: string }) {
const [err, setErr] = useState(false);
if (avatarUrl && !err) {
return <img src={avatarUrl} alt={username} onError={() => setErr(true)} className={`${size} shrink-0 rounded-full border border-white/10 object-cover`} />;
}
return (
<div className={`${size} flex shrink-0 items-center justify-center rounded-full border border-white/10 text-sm font-bold text-white/80`} style={{ background: getBg(id) }}>
{(username?.[0] ?? “U”).toUpperCase()}
</div>
);
}

// ─── Glass card ───────────────────────────────────────────────────────────────

function GlassCard({ children, className = “”, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
const Tag = onClick ? motion.button : motion.div;
return (
<Tag
onClick={onClick}
whileHover={onClick ? { y: -1 } : undefined}
transition={{ duration: 0.18 }}
className={`w-full rounded-[18px] text-left backdrop-blur-[50px] ${className}`}
style={{
background: “linear-gradient(160deg,rgba(255,255,255,0.065) 0%,rgba(255,255,255,0.022) 45%,rgba(0,0,0,0.06) 100%)”,
border: “1px solid rgba(255,255,255,0.13)”,
borderBottom: “1px solid rgba(255,255,255,0.04)”,
borderRight: “1px solid rgba(255,255,255,0.04)”,
boxShadow: “inset 0 1.5px 0 rgba(255,255,255,0.1),inset 0 -1px 0 rgba(0,0,0,0.15),0 4px 20px rgba(0,0,0,0.4)”,
}}
>
{children}
</Tag>
);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChatsPage() {
const router = useRouter();
const [query,         setQuery]         = useState(””);
const [searching,     setSearching]     = useState(false);
const [results,       setResults]       = useState<SearchUser[]>([]);
const [conversations, setConversations] = useState<ConversationRow[]>([]);

// load conversations — identical to original
useEffect(() => {
void (async () => {
const r = await fetch(”/api/chats/list”, { cache: “no-store” });
if (!r.ok) return;
const data = (await r.json()) as { conversations: ConversationRow[] };
setConversations(data.conversations ?? []);
})();
}, []);

// debounced search — identical to original
useEffect(() => {
if (query.trim().length < 3) { setResults([]); return; }
const t = setTimeout(() => {
setSearching(true);
void (async () => {
const r = await fetch(`/api/chats/search?username=${encodeURIComponent(query.trim())}`);
const data = (await r.json()) as { users: SearchUser[] };
setResults(data.users ?? []);
setSearching(false);
})();
}, 220);
return () => clearTimeout(t);
}, [query]);

const sortedConversations = useMemo(
() => […conversations].sort((a, b) => (b.lastMessage?.createdAt ?? “”).localeCompare(a.lastMessage?.createdAt ?? “”)),
[conversations]
);

// open conversation — identical to original
const openConversation = async (userId: string) => {
const r = await fetch(”/api/chats/open”, { method: “POST”, headers: { “Content-Type”: “application/json” }, body: JSON.stringify({ otherUserId: userId }) });
if (!r.ok) return;
const data = (await r.json()) as { conversation: { id: string } };
router.push(`/chats/${data.conversation.id}`);
};

const fade = { duration: 0.3, ease: “easeOut” as const };
const spring = { duration: 0.38, ease: [0.34, 1.15, 0.64, 1] as const };

return (
<motion.main
initial={{ opacity: 0, y: 18 }}
animate={{ opacity: 1, y: 0 }}
transition={fade}
className=“relative min-h-screen overflow-hidden pb-20 text-white”
style={{ background: “#000”, fontFamily: “‘Inter’, sans-serif” }}
>
{/* ambient blobs */}
<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
<div className=“absolute left-[-15%] top-16 h-56 w-56 rounded-full blur-[110px]” style={{ background: “rgba(90,16,32,0.1)” }} />
<div className=“absolute right-[-20%] top-1/3 h-72 w-72 rounded-full blur-[140px]” style={{ background: “rgba(255,255,255,0.04)” }} />
</div>

```
  {/* header */}
  <header className="relative mx-auto flex w-full max-w-xl items-center gap-3 px-4 pt-6">
    <HeaderMenuDrawer />
  </header>

  <div className="relative mx-auto mt-8 w-full max-w-xl px-4">

    {/* title row */}
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.05 }}
      className="mb-7 flex items-end justify-between"
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">private messaging</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-1.2px]" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
          Chats
        </h1>
      </div>
      <div
        className="rounded-full px-3 py-1.5 text-[12px] font-medium"
        style={{
          background: "linear-gradient(160deg,rgba(255,255,255,0.065) 0%,rgba(0,0,0,0.06) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(40px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
          color: "rgba(232,232,232,0.55)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {sortedConversations.length} active
      </div>
    </motion.div>

    {/* search */}
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.09 }}
      className="mb-6"
    >
      <label
        className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3 transition-all duration-300 focus-within:shadow-[0_0_0_1px_rgba(90,16,32,0.25)]"
        style={{
          background: "linear-gradient(160deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.018) 45%,rgba(0,0,0,0.08) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          backdropFilter: "blur(50px) saturate(1.6)",
          boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.08),inset 0 -1px 0 rgba(0,0,0,0.18)",
        }}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-white/30" fill="none" aria-hidden>
          <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search username…"
          className="w-full bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/25"
          style={{ caretColor: "#8a1f38" }}
        />
      </label>

      <AnimatePresence>
        {query.trim().length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={fade}
            className="mt-2 space-y-2"
          >
            {searching && <p className="px-1 text-[12px] text-white/40">Searching…</p>}
            {results.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ ...spring, delay: i * 0.04 }}
              >
                <GlassCard className="flex min-h-[66px] items-center gap-3 px-3.5 py-3">
                  <Avatar id={item.id} username={item.username} avatarUrl={item.avatarUrl} size="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      @{item.username}
                    </p>
                    <p className="truncate text-[11.5px] text-white/40">{item.bio || "Friend"}</p>
                  </div>
                  <button
                    onClick={() => void openConversation(item.id)}
                    className="shrink-0 rounded-[9px] px-3 py-1.5 text-[11.5px] font-semibold transition-all duration-200 active:scale-95"
                    style={{
                      background: "linear-gradient(160deg,rgba(90,16,32,0.65) 0%,rgba(50,8,18,0.55) 100%)",
                      border: "1px solid rgba(138,31,56,0.28)",
                      borderBottom: "1px solid rgba(138,31,56,0.06)",
                      boxShadow: "inset 0 1.5px 0 rgba(138,31,56,0.18)",
                      color: "rgba(255,255,255,0.85)",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    Message
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    {/* conversations list */}
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...fade, delay: 0.13 }}
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Recent chats
      </p>

      <div className="space-y-2">
        <AnimatePresence>
          {sortedConversations.map((chat, i) => {
            const left = daysLeft(chat.expiresAt);
            const urgent = left <= 2;
            return (
              <motion.div
                key={chat.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ ...spring, delay: i * 0.05 }}
              >
                <GlassCard
                  className="flex min-h-[72px] items-center gap-3 px-4 py-3.5"
                  onClick={() => router.push(`/chats/${chat.id}`)}
                >
                  <div className="relative shrink-0">
                    <Avatar id={chat.friendUser.id} username={chat.friendUser.username} avatarUrl={chat.friendUser.avatarUrl} size="h-11 w-11" />
                    {/* online dot */}
                    <span
                      className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black"
                      style={{ background: "#4ade80", boxShadow: "0 0 4px rgba(74,222,128,0.7)" }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[14px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        @{chat.friendUser.username}
                      </p>
                      {chat.lastMessage?.createdAt && (
                        <span className="shrink-0 text-[11px] text-white/30">
                          {timeAgo(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-white/40">
                      {chat.lastMessage?.text || "Start your conversation"}
                    </p>
                  </div>

                  {/* expiry badge */}
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={urgent
                      ? { background: "rgba(90,16,32,0.2)", border: "1px solid rgba(138,31,56,0.3)", color: "#f3a4bb", fontFamily: "'Space Grotesk', sans-serif" }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(232,232,232,0.4)", fontFamily: "'Space Grotesk', sans-serif" }
                    }
                  >
                    {left}d
                  </span>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!sortedConversations.length && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={fade}>
            <GlassCard className="p-12 text-center text-[13px] text-white/35">
              No chats yet. Search a username above.
            </GlassCard>
          </motion.div>
        )}
      </div>
    </motion.div>
  </div>
</motion.main>
```

);
}

"use client";

// components/friends/friends-page.tsx
// Drop-in replacement - matches VexaChat project patterns exactly.
// APIs used (all already exist in the project):
//   GET  /api/friends/list
//   GET  /api/friends/requests
//   GET  /api/friends/blocked
//   GET  /api/friends/search?username=...
//   POST /api/friends/request          { receiverId }
//   POST /api/friends/requests/[id]/accept
//   POST /api/friends/requests/[id]/reject
//   POST /api/friends/remove           { userId }
//   POST /api/friends/block            { userId }
//   POST /api/friends/unblock          { userId }
//   POST /api/chats/open               { otherUserId }

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// --- Types --------------------------------------------------------------------

type UserCard = {
id: string;
username: string;
avatarUrl: string;
bio: string;
verified?: boolean;
relationship?: "none" | "pending" | "friends" | "blocked";
};

type FriendRequestItem = {
id: string;
createdAt: string;
sender: UserCard;
};

type Tab = "friends" | "requests" | "blocked";

const TABS: { key: Tab; label: string }[] = [
{ key: "friends",  label: "Friends"  },
{ key: "requests", label: "Requests" },
{ key: "blocked",  label: "Blocked"  },
];

// --- Motion presets -----------------------------------------------------------

const spring = { duration: 0.4, ease: [0.34, 1.15, 0.64, 1] as const };
const fade   = { duration: 0.3, ease: "easeOut" as const };

// --- Helpers ------------------------------------------------------------------

function initials(value: string) {
return (value?.[0] ?? "U").toUpperCase();
}

const GRADIENTS = [
"linear-gradient(135deg,#0d0103,#3a0a14)",
"linear-gradient(135deg,#04080f,#0e1726)",
"linear-gradient(135deg,#030d05,#0c1c0e)",
"linear-gradient(135deg,#0d0802,#241804)",
"linear-gradient(135deg,#07041a,#150e30)",
];

function getBg(id: string) {
let h = 0;
for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

// --- Avatar -------------------------------------------------------------------

function Avatar({
user,
size = "h-11 w-11",
ring = false,
}: {
user: Pick<UserCard, "id" | "avatarUrl" | "username">;
size?: string;
ring?: boolean;
}) {
const [err, setErr] = useState(false);
const ringStyle: React.CSSProperties = ring
? { boxShadow: "0 0 0 2px rgba(74,222,128,0.35), 0 0 8px rgba(74,222,128,0.12)", borderColor: "rgba(74,222,128,0.3)" }
: {};

if (user.avatarUrl && !err) {
return (
<img
src={user.avatarUrl}
alt={user.username}
onError={() => setErr(true)}
className={`${size} shrink-0 rounded-full border border-white/10 object-cover`}
style={ringStyle}
/>
);
}

return (
<div
className={`${size} flex shrink-0 items-center justify-center rounded-full border border-white/10 text-sm font-bold text-white/80`}
style={{ background: getBg(user.id), ...ringStyle }}
>
{initials(user.username)}
</div>
);
}

// --- Glass card ---------------------------------------------------------------

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
return (
<div
className={`rounded-[18px] backdrop-blur-[50px] ${className}`}
style={{
background: "linear-gradient(160deg,rgba(255,255,255,0.065) 0%,rgba(255,255,255,0.022) 45%,rgba(0,0,0,0.06) 100%)",
border: "1px solid rgba(255,255,255,0.13)",
borderBottom: "1px solid rgba(255,255,255,0.04)",
borderRight: "1px solid rgba(255,255,255,0.04)",
boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1),inset 0 -1px 0 rgba(0,0,0,0.15),0 4px 20px rgba(0,0,0,0.4)",
}}
>
{children}
</div>
);
}

// --- Glass button -------------------------------------------------------------

type BtnVariant = "default" | "wine" | "ghost";

function GlassBtn({
children, onClick, disabled, variant = "default", className = "",
}: {
children: React.ReactNode;
onClick?: () => void;
disabled?: boolean;
variant?: BtnVariant;
className?: string;
}) {
const styles: Record<BtnVariant, React.CSSProperties> = {
default: {
background: "linear-gradient(160deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.03) 50%,rgba(0,0,0,0.08) 100%)",
border: "1px solid rgba(255,255,255,0.14)",
borderBottom: "1px solid rgba(255,255,255,0.04)",
boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1)",
color: "rgba(255,255,255,0.8)",
},
wine: {
background: "linear-gradient(160deg,rgba(90,16,32,0.65) 0%,rgba(50,8,18,0.55) 100%)",
border: "1px solid rgba(138,31,56,0.28)",
borderBottom: "1px solid rgba(138,31,56,0.06)",
boxShadow: "inset 0 1.5px 0 rgba(138,31,56,0.18)",
color: "rgba(255,255,255,0.85)",
},
ghost: {
background: "transparent",
border: "1px solid rgba(255,255,255,0.07)",
color: "rgba(232,232,232,0.35)",
},
};

return (
<button
onClick={onClick}
disabled={disabled}
className={`inline-flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[11.5px] font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
style={{ fontFamily: "inherit", ...styles[variant] }}
>
{children}
</button>
);
}

// --- Tab bar with sliding indicator ------------------------------------------

function TabBar({ active, onChange, requestCount }: { active: Tab; onChange: (t: Tab) => void; requestCount: number }) {
const refs = useRef<(HTMLButtonElement | null)[]>([]);
const [line, setLine] = useState({ left: 0, width: 0 });

useEffect(() => {
const idx = TABS.findIndex((t) => t.key === active);
const el = refs.current[idx];
if (el) setLine({ left: el.offsetLeft, width: el.offsetWidth });
}, [active]);

return (
<div className="relative flex border-b border-white/[0.06]">
{TABS.map((t, i) => (
<button
key={t.key}
ref={(el) => { refs.current[i] = el; }}
onClick={() => onChange(t.key)}
className="relative flex items-center gap-1.5 pb-2.5 pr-5 text-[13px] font-semibold tracking-[0.01em] transition-colors duration-200"
style={{
color: active === t.key ? "#fff" : "rgba(232,232,232,0.35)",
fontFamily: "'Space Grotesk', sans-serif",
}}
>
{t.label}
{t.key === "requests" && requestCount > 0 && (
<span
className="flex h-[15px] w-[15px] items-center justify-center rounded-full text-[9px] font-bold text-white"
style={{ background: "#8a1f38", boxShadow: "0 0 6px rgba(90,16,32,0.4)" }}
>
{requestCount}
</span>
)}
</button>
))}
<motion.div
className="absolute bottom-[-1px] h-[1.5px] rounded-full"
animate={{ left: line.left, width: line.width }}
transition={{ type: "spring", stiffness: 400, damping: 32 }}
style={{ background: "#8a1f38", boxShadow: "0 0 8px rgba(90,16,32,0.35)" }}
/>
</div>
);
}

// --- Profile modal ------------------------------------------------------------

function ProfileModal({
user, requestMap, onClose, onSendRequest, onAccept, onReject, onRemove, onBlock, onUnblock, onMessage,
}: {
user: UserCard;
requestMap: Map<string, string>;
onClose: () => void;
onSendRequest: (id: string) => void;
onAccept: (reqId: string) => void;
onReject: (reqId: string) => void;
onRemove: (id: string) => void;
onBlock: (id: string) => void;
onUnblock: (id: string) => void;
onMessage: (id: string) => void;
}) {
const reqId = requestMap.get(user.id);
return (
<>
<motion.button
className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
onClick={onClose} aria-label="Close"
/>
<motion.div
initial={{ opacity: 0, y: 10, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 10, scale: 0.95 }}
transition={{ duration: 0.25, ease: "easeOut" }}
className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] p-6"
style={{
background: "linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.02) 45%,rgba(0,0,0,0.1) 100%)",
border: "1px solid rgba(255,255,255,0.14)",
borderBottom: "1px solid rgba(255,255,255,0.04)",
backdropFilter: "blur(60px) saturate(1.6)",
boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1),0 30px 80px rgba(0,0,0,0.7)",
}}
>
<button
onClick={onClose}
className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-xs text-white/50 transition hover:text-white/80"
>x</button>

    <div className="flex flex-col items-center text-center">
      <Avatar user={user} size="h-20 w-20" />
      <p className="mt-3 text-[15px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        @{user.username}
      </p>
      <p className="mt-1 max-w-[260px] text-[12px] leading-relaxed text-white/50">
        {user.bio?.slice(0, 120) || "No bio yet."}
      </p>
      {user.verified && (
        <span className="mt-2 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/60">
          v Verified
        </span>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {user.relationship === "pending"  && <GlassBtn disabled>Pending</GlassBtn>}
        {user.relationship === "friends"  && (
          <>
            <GlassBtn onClick={() => onMessage(user.id)}>Message</GlassBtn>
            <GlassBtn onClick={() => onRemove(user.id)}>Remove</GlassBtn>
            <GlassBtn variant="ghost" onClick={() => onBlock(user.id)}>Block</GlassBtn>
          </>
        )}
        {user.relationship === "blocked"  && <GlassBtn onClick={() => onUnblock(user.id)}>Unblock</GlassBtn>}
        {(!user.relationship || user.relationship === "none") && (
          <GlassBtn variant="wine" onClick={() => onSendRequest(user.id)}>Add Friend</GlassBtn>
        )}
        {reqId && (
          <>
            <GlassBtn variant="wine" onClick={() => onAccept(reqId)}>Accept</GlassBtn>
            <GlassBtn variant="ghost" onClick={() => onReject(reqId)}>Reject</GlassBtn>
          </>
        )}
      </div>
    </div>
  </motion.div>
</>

);
}

// --- Main export --------------------------------------------------------------

export function FriendsPage() {
const router = useRouter();

const [activeTab,     setActiveTab]     = useState<Tab>("friends");
const [friends,       setFriends]       = useState<UserCard[]>([]);
const [requests,      setRequests]      = useState<FriendRequestItem[]>([]);
const [blockedUsers,  setBlockedUsers]  = useState<UserCard[]>([]);
const [search,        setSearch]        = useState("");
const [searchResults, setSearchResults] = useState<UserCard[]>([]);
const [selectedUser,  setSelectedUser]  = useState<UserCard | null>(null);
const [toast,         setToast]         = useState<string | null>(null);
const loadedTabsRef = useRef<Record<Tab, boolean>>({ friends: false, requests: false, blocked: false });

// -- data loaders ----------------------------------------------------------
const loadFriends = useCallback(async () => { const r = await fetch("/api/friends/list", { cache: "no-store" }); if (r.ok) setFriends((await r.json() as { friends: UserCard[] }).friends); }, []);
const loadRequests = useCallback(async () => { const r = await fetch("/api/friends/requests", { cache: "no-store" }); if (r.ok) setRequests((await r.json() as { requests: FriendRequestItem[] }).requests); }, []);
const loadBlocked = useCallback(async () => { const r = await fetch("/api/friends/blocked", { cache: "no-store" }); if (r.ok) setBlockedUsers((await r.json() as { blocked: UserCard[] }).blocked); }, []);
const loadTabData = useCallback(async (tab: Tab, force = false) => {
if (!force && loadedTabsRef.current[tab]) return;

if (tab === "friends") await loadFriends();
if (tab === "requests") await loadRequests();
if (tab === "blocked") await loadBlocked();

loadedTabsRef.current[tab] = true;
}, [loadBlocked, loadFriends, loadRequests]);

useEffect(() => { void loadTabData("friends"); }, [loadTabData]);
useEffect(() => { void loadTabData(activeTab); }, [activeTab, loadTabData]);

// Escape key closes modal
useEffect(() => {
const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedUser(null); };
window.addEventListener("keydown", fn);
return () => window.removeEventListener("keydown", fn);
}, []);

// Auto-dismiss toast
useEffect(() => {
if (!toast) return;
const t = setTimeout(() => setToast(null), 2800);
return () => clearTimeout(t);
}, [toast]);

// Debounced search (identical pattern to chats page)
useEffect(() => {
if (search.trim().length < 3) { setSearchResults([]); return; }
const t = setTimeout(async () => {
const r = await fetch(`/api/friends/search?username=${encodeURIComponent(search.trim())}`, { cache: "no-store" });
setSearchResults(r.ok ? (await r.json() as { users: UserCard[] }).users : []);
}, 220);
return () => clearTimeout(t);
}, [search]);

const requestMap = useMemo(() => {
const m = new Map<string, string>();
for (const item of requests) m.set(item.sender.id, item.id);
return m;
}, [requests]);

// -- actions ---------------------------------------------------------------
const showToast = (msg: string) => setToast(msg);

const sendRequest = async (receiverId: string) => {
const r = await fetch("/api/friends/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId }) });
if (!r.ok) { const p = await r.json().catch(() => ({ error: "Unable to send request." })) as { error?: string }; showToast(p.error ?? "Unable to send request."); return; }
setSearchResults((prev) => prev.map((u) => u.id === receiverId ? { ...u, relationship: "pending" } : u));
setSelectedUser((prev)  => prev?.id === receiverId ? { ...prev, relationship: "pending" } : prev);
showToast("Request sent v");
loadedTabsRef.current.requests = false;
void loadTabData("requests", true);
};

const actOnRequest = async (requestId: string, action: "accept" | "reject") => {
const r = await fetch(`/api/friends/requests/${requestId}/${action}`, { method: "POST" });
if (!r.ok) return;
setRequests((prev) => prev.filter((item) => item.id !== requestId));
showToast(action === "accept" ? "Friend added v" : "Request rejected");
if (action === "accept") {
loadedTabsRef.current.friends = false;
void loadTabData("friends", true);
}
};

const removeFriend = async (userId: string) => {
await fetch("/api/friends/remove", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
setSelectedUser(null);
showToast("Friend removed");
setFriends((prev) => prev.filter((friend) => friend.id !== userId));
setSearchResults((prev) => prev.map((u) => u.id === userId ? { ...u, relationship: "none" } : u));
};

const blockUser = async (userId: string) => {
await fetch("/api/friends/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
setSearchResults((prev) => prev.map((u) => u.id === userId ? { ...u, relationship: "blocked" } : u));
setSelectedUser((prev)  => prev?.id === userId ? { ...prev, relationship: "blocked" } : prev);
showToast("User blocked");
setFriends((prev) => prev.filter((friend) => friend.id !== userId));
loadedTabsRef.current.blocked = false;
void loadTabData("blocked", true);
};

const unblockUser = async (userId: string) => {
await fetch("/api/friends/unblock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
setSearchResults((prev) => prev.map((u) => u.id === userId ? { ...u, relationship: "none" } : u));
setSelectedUser((prev)  => prev?.id === userId ? { ...prev, relationship: "none" } : prev);
showToast("User unblocked");
setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
};

const openChat = async (userId: string) => {
const r = await fetch("/api/chats/open", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otherUserId: userId }) });
if (!r.ok) return;
const d = await r.json() as { conversation: { id: string } };
router.push(`/chats/${d.conversation.id}`);
};

// --- render ---------------------------------------------------------------
return (
<main
className="relative min-h-screen overflow-hidden pb-20 pt-4 text-white"
style={{ background: "#000", fontFamily: "'Inter', sans-serif" }}
>
{/* ambient blobs - same pattern as chats page */}
<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
<div className="absolute left-[-15%] top-16 h-56 w-56 rounded-full blur-[110px]" style={{ background: "rgba(90,16,32,0.1)" }} />
<div className="absolute right-[-20%] top-1/3 h-72 w-72 rounded-full blur-[140px]" style={{ background: "rgba(255,255,255,0.04)" }} />
</div>

  <div className="relative mx-auto w-full max-w-xl px-4">

    {/* -- title row ----------------------------------- */}
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade}
      className="mb-7 flex items-end justify-between"
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">connections</p>
        <h1
          className="mt-2 text-4xl font-bold tracking-[-1.2px]"
          style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
        >
          Friends
        </h1>
        <div className="mt-1.5 flex items-center gap-2 text-[12px] text-white/35">
          <span
            className="inline-block h-[6px] w-[6px] rounded-full"
            style={{ background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.6)" }}
          />
          {friends.length} online - {friends.length} total
        </div>
      </div>

      <button
        onClick={() => setActiveTab("requests")}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200 hover:scale-[1.03] active:scale-95"
        style={{
          background: "linear-gradient(160deg,rgba(90,16,32,0.22) 0%,rgba(50,8,18,0.15) 100%)",
          border: "1px solid rgba(138,31,56,0.22)",
          backdropFilter: "blur(40px)",
          boxShadow: "inset 0 1px 0 rgba(138,31,56,0.12)",
          color: "rgba(255,255,255,0.6)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#6e1428,#8a1f38)", boxShadow: "0 0 8px rgba(90,16,32,0.4)" }}
        >
          {requests.length}
        </span>
        requests
      </button>
    </motion.div>

    {/* -- tabs ---------------------------------------- */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...fade, delay: 0.07 }}
      className="mb-5"
    >
      <TabBar active={activeTab} onChange={setActiveTab} requestCount={requests.length} />
    </motion.div>

    {/* -- search -------------------------------------- */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...fade, delay: 0.11 }}
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username..."
          className="w-full bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/25"
          style={{ caretColor: "#8a1f38" }}
        />
      </label>

      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={fade}
            className="mt-2 space-y-2"
          >
            {searchResults.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ ...spring, delay: i * 0.04 }}
              >
                <GlassCard className="flex min-h-[66px] items-center gap-3 px-3.5 py-3">
                  <button type="button" onClick={() => setSelectedUser(item)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <Avatar user={item} size="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{item.username}</p>
                      <p className="truncate text-[11.5px] text-white/40">@{item.username}</p>
                    </div>
                  </button>
                  <div onClick={(e) => e.stopPropagation()}>
                    {item.relationship === "friends" && <GlassBtn disabled>Friends</GlassBtn>}
                    {item.relationship === "pending" && <GlassBtn disabled>Pending</GlassBtn>}
                    {item.relationship === "blocked" && <GlassBtn disabled>Blocked</GlassBtn>}
                    {(!item.relationship || item.relationship === "none") && (
                      <GlassBtn variant="wine" onClick={() => void sendRequest(item.id)}>Add</GlassBtn>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    {/* -- tab panels ---------------------------------- */}
    <AnimatePresence mode="wait">

      {/* FRIENDS */}
      {activeTab === "friends" && (
        <motion.section
          key="friends"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          transition={fade}
        >
          {/* online strip */}
          {friends.length > 0 && (
            <div className="mb-5">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Online now
              </p>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {friends.slice(0, 8).map((f, i) => (
                  <motion.button
                    key={f.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring, delay: Math.min(i, 5) * 0.03 }}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => void openChat(f.id)}
                    className="flex shrink-0 flex-col items-center gap-1.5"
                  >
                    <div className="relative">
                      <Avatar user={f} size="h-12 w-12" ring />
                      <span
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black"
                        style={{ background: "#4ade80", boxShadow: "0 0 5px rgba(74,222,128,0.7)" }}
                      />
                    </div>
                    <span className="max-w-[52px] truncate text-[10px] text-white/40">{f.username}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {friends.length > 0 && (
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              All friends
            </p>
          )}

          {friends.length > 0 ? (
            <div className="space-y-2">
              {friends.map((friend, i) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ ...spring, delay: Math.min(i, 6) * 0.02 }}
                  whileHover={{ y: -1, transition: { duration: 0.2 } }}
                >
                  <GlassCard className="flex min-h-[70px] items-center gap-3 px-4 py-3">
                    <button type="button" onClick={() => setSelectedUser({ ...friend, relationship: "friends" })} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <div className="relative">
                        <Avatar user={friend} size="h-11 w-11" />
                        <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black" style={{ background: "#4ade80", boxShadow: "0 0 4px rgba(74,222,128,0.7)" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{friend.username}</p>
                        <p className="truncate text-[11.5px] text-white/40">@{friend.username}</p>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <GlassBtn onClick={() => void openChat(friend.id)}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Msg
                      </GlassBtn>
                      <GlassBtn variant="ghost" onClick={() => void removeFriend(friend.id)}>
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </GlassBtn>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <GlassCard className="p-12 text-center text-[13px] text-white/40">
              No connections yet. Start searching above.
            </GlassCard>
          )}
        </motion.section>
      )}

      {/* REQUESTS */}
      {activeTab === "requests" && (
        <motion.section
          key="requests"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          transition={fade}
          className="space-y-2"
        >
          {requests.length > 0 && (
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Incoming
            </p>
          )}
          {requests.length > 0 ? (
            requests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ ...spring, delay: Math.min(i, 6) * 0.02 }}
              >
                <GlassCard className="flex min-h-[70px] items-center gap-3 px-4 py-3">
                  <button type="button" onClick={() => setSelectedUser({ ...req.sender, relationship: "none" })}>
                    <Avatar user={req.sender} size="h-11 w-11" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      @{req.sender.username}
                    </p>
                    <p className="truncate text-[11.5px] text-white/40">{req.sender.bio || "Wants to connect"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <GlassBtn variant="wine" onClick={() => void actOnRequest(req.id, "accept")}>Accept</GlassBtn>
                    <GlassBtn variant="ghost" onClick={() => void actOnRequest(req.id, "reject")}>
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </GlassBtn>
                  </div>
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <GlassCard className="p-12 text-center text-[13px] text-white/40">No pending requests.</GlassCard>
          )}
        </motion.section>
      )}

      {/* BLOCKED */}
      {activeTab === "blocked" && (
        <motion.section
          key="blocked"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          transition={fade}
          className="space-y-2"
        >
          {blockedUsers.length > 0 ? (
            blockedUsers.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ ...spring, delay: Math.min(i, 6) * 0.02 }}
              >
                <GlassCard className="flex min-h-[70px] items-center gap-3 px-4 py-3">
                  <button type="button" onClick={() => setSelectedUser({ ...user, relationship: "blocked" })}>
                    <Avatar user={user} size="h-11 w-11" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{user.username}</p>
                    <p className="truncate text-[11.5px] text-white/40">@{user.username}</p>
                  </div>
                  <GlassBtn onClick={() => void unblockUser(user.id)}>Unblock</GlassBtn>
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <GlassCard className="p-12 text-center text-[13px] text-white/40">No blocked users.</GlassCard>
          )}
        </motion.section>
      )}

    </AnimatePresence>
  </div>

  {/* -- profile modal -- */}
  <AnimatePresence>
    {selectedUser && (
      <ProfileModal
        user={selectedUser}
        requestMap={requestMap}
        onClose={() => setSelectedUser(null)}
        onSendRequest={(id) => void sendRequest(id)}
        onAccept={(reqId) => void actOnRequest(reqId, "accept")}
        onReject={(reqId) => void actOnRequest(reqId, "reject")}
        onRemove={(id) => void removeFriend(id)}
        onBlock={(id) => void blockUser(id)}
        onUnblock={(id) => void unblockUser(id)}
        onMessage={(id) => void openChat(id)}
      />
    )}
  </AnimatePresence>

  {/* -- toast - identical to existing pattern -- */}
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }}
        transition={fade}
        onClick={() => setToast(null)}
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-full px-4 py-2 text-[12px] text-white/85"
        style={{
          background: "linear-gradient(160deg,rgba(255,255,255,0.09) 0%,rgba(0,0,0,0.15) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(40px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        {toast}
      </motion.div>
    )}
  </AnimatePresence>
</main>

);
}

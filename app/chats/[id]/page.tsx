“use client”;

// app/chats/[id]/page.tsx
// Redesigned UI — liquid glass dark theme, all original logic preserved exactly.
// APIs: GET /api/chats/[id]/messages · POST /api/chats/[id]/send
//       POST /api/chats/[id]/media/upload · GET /api/chats/list · GET /api/me

import { AnimatePresence, motion } from “framer-motion”;
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from “react”;
import { useParams, useRouter } from “next/navigation”;
import { compressChatImage, validateVideo } from “@/lib/chat-media-client”;

// ─── Types (identical to original) ───────────────────────────────────────────

type ChatMedia    = { id: string; type: “image” | “video”; url: string; expiresAt: string };
type ChatMessage  = { id: string; senderId: string; type: string; text: string | null; createdAt: string; media?: ChatMedia | null };
type ConversationPayload = {
conversation: { id: string; userAId: string; userBId: string; expiresAt: string };
messages: ChatMessage[];
nextCursor: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysLeft(expiresAt: string) {
const diff = new Date(expiresAt).getTime() - Date.now();
return Math.max(0, Math.ceil(diff / 86400000));
}

function expiresInLabel(expiresAt: string) {
const diffMs = new Date(expiresAt).getTime() - Date.now();
if (diffMs <= 0) return “expired”;
const hours = Math.floor(diffMs / 3600000);
const minutes = Math.floor((diffMs % 3600000) / 60000);
if (hours > 0) return `expires in ${hours}h`;
return `expires in ${Math.max(1, minutes)}m`;
}

function formatTime(iso: string) {
return new Date(iso).toLocaleTimeString([], { hour: “2-digit”, minute: “2-digit” });
}

const GRADIENTS = [
“linear-gradient(135deg,#0d0103,#3a0a14)”,
“linear-gradient(135deg,#04080f,#0e1726)”,
“linear-gradient(135deg,#030d05,#0c1c0e)”,
];
function getBg(id: string) {
let h = 0;
for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChatThreadPage() {
const params  = useParams<{ id: string }>();
const router  = useRouter();

// ── refs ──────────────────────────────────────────────────────────────────
const messagesContainerRef = useRef<HTMLDivElement | null>(null);
const fileInputRef         = useRef<HTMLInputElement | null>(null);
const pollIntervalRef      = useRef<ReturnType<typeof setInterval> | null>(null);
const pollInFlightRef      = useRef(false);
const didInitialScrollRef  = useRef(false);
const textareaRef          = useRef<HTMLTextAreaElement | null>(null);

// ── state ─────────────────────────────────────────────────────────────────
const [pollDelayMs,          setPollDelayMs]          = useState(2500);
const [messages,             setMessages]             = useState<ChatMessage[]>([]);
const [expiresAt,            setExpiresAt]            = useState(””);
const [nextCursor,           setNextCursor]           = useState<string | null>(null);
const [friend,               setFriend]               = useState<{ username: string; avatarUrl: string; id: string } | null>(null);
const [input,                setInput]                = useState(””);
const [expired,              setExpired]              = useState(false);
const [currentUserId,        setCurrentUserId]        = useState<string>(””);
const [showNewMessagesPill,  setShowNewMessagesPill]  = useState(false);
const [isPageVisible,        setIsPageVisible]        = useState(true);
const [isAuthenticated,      setIsAuthenticated]      = useState(true);
const [isExiting,            setIsExiting]            = useState(false);
const [showExpiryInfo,       setShowExpiryInfo]       = useState(false);
const [uploading,            setUploading]            = useState(false);
const [uploadStatus,         setUploadStatus]         = useState<string>(””);

// ── scroll helpers (identical to original) ────────────────────────────────
const isNearBottom = useCallback(() => {
const node = messagesContainerRef.current;
if (!node) return true;
return node.scrollHeight - node.scrollTop - node.clientHeight < 80;
}, []);

const scrollToBottom = useCallback((behavior: ScrollBehavior = “smooth”) => {
const node = messagesContainerRef.current;
if (!node) return;
node.scrollTo({ top: node.scrollHeight, behavior });
}, []);

const mergeMessages = useCallback((prev: ChatMessage[], incoming: ChatMessage[]) => {
if (!incoming.length) return prev;
const merged = […prev];
const ids = new Set(prev.map((m) => m.id));
for (const m of incoming) { if (!ids.has(m.id)) { ids.add(m.id); merged.push(m); } }
return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}, []);

// ── loadMessages (identical to original) ──────────────────────────────────
const loadMessages = useCallback(async (cursor?: string) => {
const r = await fetch(`/api/chats/${params.id}/messages${cursor ? `?cursor=${cursor}` : ""}`, { cache: “no-store” });
if (r.status === 410) return setExpired(true);
if (r.status === 401) return setIsAuthenticated(false);
if (!r.ok) return;

```
const data = (await r.json()) as ConversationPayload;
setExpiresAt(data.conversation.expiresAt);
setNextCursor(data.nextCursor);
setMessages((prev) => (cursor ? [...data.messages, ...prev] : data.messages));

const [listRes, meRes] = await Promise.all([fetch("/api/chats/list", { cache: "no-store" }), fetch("/api/me")]);
if (listRes.ok) {
  const listData = (await listRes.json()) as { conversations: { id: string; friendUser: { username: string; avatarUrl: string; id: string } }[] };
  const row = listData.conversations.find((item) => item.id === params.id);
  if (row) setFriend(row.friendUser);
}
if (meRes.ok) {
  const meData = (await meRes.json()) as { user: { id: string } };
  setCurrentUserId(meData.user?.id ?? "");
} else if (meRes.status === 401) setIsAuthenticated(false);
```

}, [params.id]);

// ── polling (identical to original) ───────────────────────────────────────
const pollForNewMessages = useCallback(async () => {
if (pollInFlightRef.current || expired || !isAuthenticated || !isPageVisible) return;
pollInFlightRef.current = true;
const wasNearBottom = isNearBottom();
try {
const newestCreatedAt = messages[messages.length - 1]?.createdAt;
const query = newestCreatedAt ? `?after=${encodeURIComponent(newestCreatedAt)}` : “”;
const r = await fetch(`/api/chats/${params.id}/messages${query}`, { cache: “no-store” });
if (r.status === 410) return setExpired(true);
if (r.status === 401) return setIsAuthenticated(false);
if (!r.ok) throw new Error(“poll failed”);
const data = (await r.json()) as ConversationPayload;
setExpiresAt(data.conversation.expiresAt);
if (data.messages.length) {
setMessages((prev) => mergeMessages(prev, data.messages));
if (wasNearBottom) { setShowNewMessagesPill(false); setTimeout(() => scrollToBottom(“smooth”), 30); }
else setShowNewMessagesPill(true);
}
setPollDelayMs(2500);
} catch { setPollDelayMs(5000); }
finally { pollInFlightRef.current = false; }
}, [expired, isAuthenticated, isNearBottom, isPageVisible, mergeMessages, messages, params.id, scrollToBottom]);

useEffect(() => { void loadMessages(); }, [loadMessages]);

useEffect(() => {
const fn = () => {
const visible = !document.hidden;
setIsPageVisible(visible);
if (!visible && pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
};
document.addEventListener(“visibilitychange”, fn);
return () => document.removeEventListener(“visibilitychange”, fn);
}, []);

useEffect(() => {
if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
if (!expired && isAuthenticated && isPageVisible) {
pollIntervalRef.current = setInterval(() => void pollForNewMessages(), pollDelayMs);
}
return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; };
}, [expired, isAuthenticated, isPageVisible, pollDelayMs, pollForNewMessages]);

useEffect(() => {
if (!messages.length) return;
if (!didInitialScrollRef.current) { didInitialScrollRef.current = true; scrollToBottom(“auto”); return; }
if (isNearBottom()) scrollToBottom(“smooth”);
}, [isNearBottom, messages.length, scrollToBottom]);

// ── send (identical to original) ──────────────────────────────────────────
const send = async () => {
if (!input.trim() || expired) return;
const r = await fetch(`/api/chats/${params.id}/send`, { method: “POST”, headers: { “Content-Type”: “application/json” }, body: JSON.stringify({ text: input.trim() }) });
if (r.status === 410) return setExpired(true);
if (!r.ok) return;
setInput(””);
if (textareaRef.current) textareaRef.current.style.height = “auto”;
await pollForNewMessages();
scrollToBottom(“smooth”);
};

// ── attach (identical to original) ────────────────────────────────────────
const handleAttach = async (event: ChangeEvent<HTMLInputElement>) => {
const file = event.target.files?.[0];
event.target.value = “”;
if (!file || expired) return;
if (typeof params.id !== “string” || !params.id.trim()) { setUploadStatus(“Invalid conversation.”); return; }
try {
setUploading(true); setUploadStatus(“Preparing media…”);
let mediaType: “image” | “video”;
let uploadPayload: Blob = file;
let uploadFileName = file.name || “upload”;
const fileType = file.type || “”;
const normalizedFileType = fileType.toLowerCase();
const fileName = file.name.toLowerCase();
const looksLikeImage = normalizedFileType.startsWith(“image/”) || (!fileType && /.(jpe?g|png|gif|webp|heic|heif)$/i.test(fileName));
const looksLikeVideo = normalizedFileType.startsWith(“video/”) || (!fileType && /.(mp4|mov|webm|m4v)$/i.test(fileName));
if (looksLikeImage) {
mediaType = “image”;
const imageFile = fileType ? file : new File([file], uploadFileName, { type: normalizedFileType || “image/jpeg”, lastModified: file.lastModified });
const compressed = await compressChatImage(imageFile); uploadPayload = compressed.blob; uploadFileName = compressed.fileName;
} else if (looksLikeVideo) {
mediaType = “video”;
const videoFile = fileType ? file : new File([file], uploadFileName, { type: normalizedFileType || “video/mp4”, lastModified: file.lastModified });
await validateVideo(videoFile); uploadPayload = videoFile;
} else { throw new Error(“Please select an image or video file.”); }
setUploadStatus(“Uploading…”);
const formData = new FormData();
formData.append(“type”, mediaType); formData.append(“file”, uploadPayload, uploadFileName);
const r = await fetch(`/api/chats/${params.id}/media/upload`, { method: “POST”, body: formData });
if (r.status === 410) return setExpired(true);
let payload: { error?: string } | null = null;
let failedJson = false;
try { payload = (await r.json()) as { error?: string }; } catch { payload = null; failedJson = true; }
if (!r.ok) throw new Error(payload?.error ?? (failedJson ? “Upload failed (server error).” : “Upload failed.”));
setUploadStatus(“Uploaded ✓”);
await pollForNewMessages(); scrollToBottom(“smooth”);
setTimeout(() => setUploadStatus(””), 900);
} catch (e) { setUploadStatus(e instanceof Error ? e.message : “Upload failed”); }
finally { setUploading(false); }
};

const left = useMemo(() => (expiresAt ? daysLeft(expiresAt) : 0), [expiresAt]);
const isSendDisabled = !input.trim() || expired;
const urgent = left <= 2;

// auto-resize textarea
const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
setInput(e.target.value);
e.target.style.height = “auto”;
e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
};

const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
if (e.key === “Enter” && !e.shiftKey) { e.preventDefault(); void send(); }
};

// avatar fallback
const [avatarErr, setAvatarErr] = useState(false);

return (
<motion.main
className=“fixed inset-0 flex h-dvh flex-col overflow-hidden text-white”
style={{ background: “#000” }}
initial={{ x: 40, opacity: 0 }}
animate={isExiting ? { x: 40, opacity: 0 } : { x: 0, opacity: 1 }}
exit={{ x: -40, opacity: 0 }}
transition={{ duration: 0.25, ease: “easeOut” }}
>
{/* ── HEADER ──────────────────────────────────────── */}
<motion.header
className=“z-20 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.9rem)]”
style={{
background: “linear-gradient(180deg,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.7) 100%)”,
borderBottom: “1px solid rgba(255,255,255,0.07)”,
backdropFilter: “blur(40px) saturate(1.6)”,
}}
>
<div className="flex items-center justify-between gap-2">
{/* back */}
<button
onClick={() => { setIsExiting(true); setTimeout(() => router.push(”/chats”), 250); }}
className=“flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-90”
style={{
background: “linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(0,0,0,0.1) 100%)”,
border: “1px solid rgba(255,255,255,0.13)”,
borderBottom: “1px solid rgba(255,255,255,0.04)”,
boxShadow: “inset 0 1.5px 0 rgba(255,255,255,0.1)”,
}}
aria-label=“Back”
>
<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
<path d="M19 12H5M12 5l-7 7 7 7" />
</svg>
</button>

```
      {/* friend info */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-2">
        {friend?.avatarUrl && !avatarErr ? (
          <img src={friend.avatarUrl} alt={friend.username} onError={() => setAvatarErr(true)} className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover" />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-sm font-bold text-white/80" style={{ background: getBg(friend?.id ?? "x") }}>
            {(friend?.username?.[0] ?? "U").toUpperCase()}
          </div>
        )}
        <div className="min-w-0 text-left">
          <p className="truncate text-[14px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {friend?.username ? `@${friend.username}` : "User"}
          </p>
          <p className="text-[11px] text-white/40">Private chat</p>
        </div>
      </div>

      {/* expiry pill */}
      <button
        onClick={() => setShowExpiryInfo(true)}
        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-200 active:scale-95"
        style={urgent
          ? { background: "rgba(90,16,32,0.2)", border: "1px solid rgba(138,31,56,0.3)", color: "#f3a4bb", fontFamily: "'Space Grotesk', sans-serif" }
          : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(232,232,232,0.4)", fontFamily: "'Space Grotesk', sans-serif" }
        }
      >
        {left}d left
      </button>
    </div>
  </motion.header>

  {/* ── EXPIRY INFO MODAL ────────────────────────────── */}
  <AnimatePresence>
    {showExpiryInfo && (
      <>
        <motion.button
          className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowExpiryInfo(false)}
          aria-label="Close"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-[24px] p-6"
          style={{
            background: "linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(0,0,0,0.1) 100%)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(60px) saturate(1.6)",
            boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.1),0 30px 80px rgba(0,0,0,0.7)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[15px] font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Chat expiration</p>
          <p className="mt-3 text-[13px] leading-relaxed text-white/60">
            This conversation expires in <strong className="text-white">{left} days</strong>. After that, all messages will be permanently deleted.
          </p>
          <button
            onClick={() => setShowExpiryInfo(false)}
            className="mt-5 w-full rounded-2xl py-2.5 text-[13px] font-semibold text-white/80 transition-all active:scale-95"
            style={{
              background: "linear-gradient(160deg,rgba(255,255,255,0.08) 0%,rgba(0,0,0,0.08) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Got it
          </button>
        </motion.div>
      </>
    )}
  </AnimatePresence>

  {/* ── MESSAGES ─────────────────────────────────────── */}
  <section className="relative flex min-h-0 flex-1 flex-col">
    <div
      ref={messagesContainerRef}
      onScroll={() => isNearBottom() && setShowNewMessagesPill(false)}
      className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3"
      style={{ scrollbarWidth: "none" }}
    >
      {/* load older */}
      {nextCursor && (
        <button
          onClick={() => void loadMessages(nextCursor)}
          className="mb-4 w-full rounded-full py-2 text-[12px] text-white/50 transition-all hover:text-white/75"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
        >
          Load older messages
        </button>
      )}

      {/* message list */}
      <div className="flex flex-col gap-1.5">
        {messages.map((msg, i) => {
          const mine = Boolean(currentUserId && msg.senderId === currentUserId);
          const showTime = i === messages.length - 1 || new Date(messages[i + 1]?.createdAt).getTime() - new Date(msg.createdAt).getTime() > 300000;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              <div
                className="max-w-[82%] rounded-[18px] px-3.5 py-2.5"
                style={mine
                  ? {
                      background: "linear-gradient(160deg,rgba(90,16,32,0.5) 0%,rgba(50,8,18,0.4) 100%)",
                      border: "1px solid rgba(138,31,56,0.25)",
                      borderBottom: "1px solid rgba(138,31,56,0.08)",
                      boxShadow: "inset 0 1.5px 0 rgba(138,31,56,0.15),0 4px 16px rgba(0,0,0,0.35)",
                      backdropFilter: "blur(40px)",
                    }
                  : {
                      background: "linear-gradient(160deg,rgba(255,255,255,0.065) 0%,rgba(255,255,255,0.022) 45%,rgba(0,0,0,0.06) 100%)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.09),0 4px 16px rgba(0,0,0,0.3)",
                      backdropFilter: "blur(40px)",
                    }
                }
              >
                {msg.media ? (
                  <div className="space-y-2">
                    {msg.media.type === "image" ? (
                      <img src={msg.media.url} alt="Shared image" className="max-h-72 w-full rounded-xl border border-white/10 object-cover" />
                    ) : (
                      <video src={msg.media.url} controls preload="metadata" className="max-h-72 w-full rounded-xl border border-white/10" />
                    )}
                    <span className="inline-flex rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] text-white/60">
                      {expiresInLabel(msg.media.expiresAt)}
                    </span>
                  </div>
                ) : (
                  <p className="text-[14px] leading-relaxed text-white">{msg.text}</p>
                )}
              </div>

              {showTime && (
                <span className="mt-1 px-1 text-[10px] text-white/25">{formatTime(msg.createdAt)}</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>

    {/* new messages pill */}
    <AnimatePresence>
      {showNewMessagesPill && (
        <motion.button
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          onClick={() => { scrollToBottom("smooth"); setShowNewMessagesPill(false); }}
          className="absolute inset-x-0 bottom-4 mx-auto block w-fit rounded-full px-3.5 py-1.5 text-[12px] font-medium"
          style={{
            background: "linear-gradient(160deg,rgba(90,16,32,0.6) 0%,rgba(50,8,18,0.5) 100%)",
            border: "1px solid rgba(138,31,56,0.3)",
            color: "#f3a4bb",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          ↓ New messages
        </motion.button>
      )}
    </AnimatePresence>
  </section>

  {/* ── INPUT FOOTER ─────────────────────────────────── */}
  <footer
    className="z-20 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2"
    style={{
      background: "linear-gradient(0deg,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.7) 100%)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(40px)",
    }}
  >
    {/* upload status */}
    <AnimatePresence>
      {uploadStatus && (
        <motion.p
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="mb-1.5 text-center text-[11px] text-white/50"
        >
          {uploadStatus}
        </motion.p>
      )}
    </AnimatePresence>

    <div
      className="flex items-end gap-2"
      style={{
        background: "linear-gradient(160deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.018) 45%,rgba(0,0,0,0.08) 100%)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        borderRadius: 26,
        padding: "8px 8px 8px 14px",
        backdropFilter: "blur(50px) saturate(1.6)",
        boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.09),inset 0 -1px 0 rgba(0,0,0,0.2),0 4px 24px rgba(0,0,0,0.5)",
      }}
    >
      {/* attach */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => void handleAttach(e)} disabled={expired || uploading} />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={expired || uploading}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-all duration-200 hover:text-white/65 disabled:opacity-30"
        aria-label="Attach"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>

      {/* emoji */}
      <button
        disabled={expired}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-all duration-200 hover:text-white/65 disabled:opacity-30"
        aria-label="Emoji"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 13s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </button>

      {/* text input */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message"
        rows={1}
        disabled={expired}
        className="flex-1 resize-none bg-transparent text-[14px] leading-relaxed text-white outline-none placeholder:text-white/25 disabled:opacity-50"
        style={{ caretColor: "#8a1f38", scrollbarWidth: "none", maxHeight: 120, alignSelf: "center" }}
      />

      {/* send */}
      <button
        disabled={isSendDisabled}
        onClick={() => void send()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-90 disabled:opacity-30"
        style={{
          background: isSendDisabled
            ? "rgba(255,255,255,0.04)"
            : "linear-gradient(160deg,rgba(120,25,48,0.95) 0%,rgba(65,10,24,0.92) 55%,rgba(30,4,12,0.97) 100%)",
          border: isSendDisabled ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(150,40,65,0.28)",
          borderBottom: "1px solid rgba(0,0,0,0.4)",
          boxShadow: isSendDisabled ? "none" : "inset 0 1.5px 0 rgba(220,80,110,0.2),0 4px 16px rgba(0,0,0,0.4)",
        }}
        aria-label="Send"
      >
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 1, color: isSendDisabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.9)" }}>
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  </footer>
</motion.main>
```

);
}

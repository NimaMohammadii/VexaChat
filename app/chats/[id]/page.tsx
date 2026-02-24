"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { compressChatImage, validateVideo } from "@/lib/chat-media-client";

type ChatMedia = { id: string; type: "image" | "video"; url: string; expiresAt: string };
type ChatMessage = { id: string; senderId: string; type: string; text: string | null; createdAt: string; media?: ChatMedia | null };

type ConversationPayload = {
  conversation: { id: string; userAId: string; userBId: string; expiresAt: string };
  messages: ChatMessage[];
  nextCursor: string | null;
};

function daysLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function expiresInLabel(expiresAt: string) {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "expired";
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `expires in ${hours}h`;
  return `expires in ${Math.max(1, minutes)}m`;
}

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInFlightRef = useRef(false);
  const [pollDelayMs, setPollDelayMs] = useState(2500);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [friend, setFriend] = useState<{ username: string; avatarUrl: string; id: string } | null>(null);
  const [input, setInput] = useState("");
  const [expired, setExpired] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showExpiryInfo, setShowExpiryInfo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const didInitialScrollRef = useRef(false);

  const isNearBottom = useCallback(() => {
    const node = messagesContainerRef.current;
    if (!node) return true;
    return node.scrollHeight - node.scrollTop - node.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const node = messagesContainerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const mergeMessages = useCallback((prev: ChatMessage[], incoming: ChatMessage[]) => {
    if (!incoming.length) return prev;
    const merged = [...prev];
    const existingIds = new Set(prev.map((message) => message.id));
    for (const message of incoming) {
      if (!existingIds.has(message.id)) {
        existingIds.add(message.id);
        merged.push(message);
      }
    }
    return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, []);

  const loadMessages = useCallback(
    async (cursor?: string) => {
      const response = await fetch(`/api/chats/${params.id}/messages${cursor ? `?cursor=${cursor}` : ""}`, { cache: "no-store" });
      if (response.status === 410) return setExpired(true);
      if (response.status === 401) return setIsAuthenticated(false);
      if (!response.ok) return;

      const data = (await response.json()) as ConversationPayload;
      setExpiresAt(data.conversation.expiresAt);
      setNextCursor(data.nextCursor);
      setMessages((prev) => (cursor ? [...data.messages, ...prev] : data.messages));

      const [listResponse, me] = await Promise.all([fetch("/api/chats/list", { cache: "no-store" }), fetch("/api/me")]);
      if (listResponse.ok) {
        const listData = (await listResponse.json()) as { conversations: { id: string; friendUser: { username: string; avatarUrl: string; id: string } }[] };
        const row = listData.conversations.find((item) => item.id === params.id);
        if (row) setFriend(row.friendUser);
      }

      if (me.ok) {
        const meData = (await me.json()) as { user: { id: string } };
        setCurrentUserId(meData.user?.id ?? "");
      } else if (me.status === 401) {
        setIsAuthenticated(false);
      }
    },
    [params.id]
  );

  const pollForNewMessages = useCallback(async () => {
    if (pollInFlightRef.current || expired || !isAuthenticated || !isPageVisible) return;
    pollInFlightRef.current = true;
    const wasNearBottom = isNearBottom();

    try {
      const newestCreatedAt = messages[messages.length - 1]?.createdAt;
      const query = newestCreatedAt ? `?after=${encodeURIComponent(newestCreatedAt)}` : "";
      const response = await fetch(`/api/chats/${params.id}/messages${query}`, { cache: "no-store" });

      if (response.status === 410) return setExpired(true);
      if (response.status === 401) return setIsAuthenticated(false);
      if (!response.ok) throw new Error("poll failed");

      const data = (await response.json()) as ConversationPayload;
      setExpiresAt(data.conversation.expiresAt);
      if (data.messages.length) {
        setMessages((prev) => mergeMessages(prev, data.messages));
        if (wasNearBottom) {
          setShowNewMessagesPill(false);
          setTimeout(() => scrollToBottom("smooth"), 30);
        } else {
          setShowNewMessagesPill(true);
        }
      }

      setPollDelayMs(2500);
    } catch {
      setPollDelayMs(5000);
    } finally {
      pollInFlightRef.current = false;
    }
  }, [expired, isAuthenticated, isNearBottom, isPageVisible, mergeMessages, messages, params.id, scrollToBottom]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      if (!visible && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (!expired && isAuthenticated && isPageVisible) {
      pollIntervalRef.current = setInterval(() => void pollForNewMessages(), pollDelayMs);
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    };
  }, [expired, isAuthenticated, isPageVisible, pollDelayMs, pollForNewMessages]);

  useEffect(() => {
    if (!messages.length) return;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      scrollToBottom("auto");
      return;
    }
    if (isNearBottom()) scrollToBottom("smooth");
  }, [isNearBottom, messages.length, scrollToBottom]);

  const send = async () => {
    if (!input.trim() || expired) return;
    const response = await fetch(`/api/chats/${params.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.trim() })
    });
    if (response.status === 410) return setExpired(true);
    if (!response.ok) return;
    setInput("");
    await pollForNewMessages();
    scrollToBottom("smooth");
  };

  const handleAttach = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || expired) return;

    try {
      setUploading(true);
      setUploadStatus("Preparing media...");
      let mediaType: "image" | "video";
      let uploadFile = file;

      if (file.type.startsWith("image/")) {
        mediaType = "image";
        uploadFile = await compressChatImage(file);
      } else if (file.type.startsWith("video/")) {
        mediaType = "video";
        await validateVideo(file);
      } else {
        throw new Error("Please select an image or video file.");
      }

      setUploadStatus("Uploading...");
      const formData = new FormData();
      formData.append("type", mediaType);
      formData.append("file", uploadFile);

      const response = await fetch(`/api/chats/${params.id}/media/upload`, { method: "POST", body: formData });
      if (response.status === 410) return setExpired(true);
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Upload failed.");

      setUploadStatus("Uploaded");
      await pollForNewMessages();
      scrollToBottom("smooth");
      setTimeout(() => setUploadStatus(""), 900);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const left = useMemo(() => (expiresAt ? daysLeft(expiresAt) : 0), [expiresAt]);
  const isSendDisabled = !input.trim() || expired;

  return (
    <motion.main className="fixed inset-0 flex h-dvh flex-col overflow-hidden bg-black text-white" initial={{ x: 40, opacity: 0 }} animate={isExiting ? { x: 40, opacity: 0 } : { x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
      <motion.header className="z-20 border-b border-white/[0.1] bg-black/35 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.9rem)] backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => { setIsExiting(true); setTimeout(() => router.push("/chats"), 250); }} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.05]" aria-label="Back to chats">←</button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2"><img src={friend?.avatarUrl || "https://placehold.co/40x40/111111/ffffff?text=U"} alt={friend?.username || "User avatar"} className="h-10 w-10 rounded-full border border-white/15 object-cover" /><div className="min-w-0 text-left"><p className="truncate text-sm font-semibold text-white">{friend?.username ? `@${friend.username}` : "User"}</p><p className="text-xs text-white/50">Private chat</p></div></div>
          <button onClick={() => setShowExpiryInfo(true)} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${left <= 2 ? "border-[#7a001e]/70 bg-[#7a001e]/20 text-[#f3a4bb]" : "border-white/15 bg-white/[0.05] text-white/80"}`}>{left}d</button>
        </div>
      </motion.header>

      <AnimatePresence>{showExpiryInfo ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExpiryInfo(false)} className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-5"><div onClick={(event) => event.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-white/10 bg-black p-5"><p className="text-base font-semibold">Chat expiration</p><p className="mt-3 text-sm text-white/75">This conversation expires in 15 days.</p><button onClick={() => setShowExpiryInfo(false)} className="mt-5 w-full rounded-2xl border border-white/15 bg-white/[0.06] py-2.5 text-sm">Got it</button></div></motion.div> : null}</AnimatePresence>

      <section className="relative flex min-h-0 flex-1 flex-col">
        <div ref={messagesContainerRef} onScroll={() => isNearBottom() && setShowNewMessagesPill(false)} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
          {nextCursor ? <button onClick={() => void loadMessages(nextCursor)} className="mb-4 w-full rounded-full border border-white/15 bg-white/[0.04] py-2 text-xs text-white/70">Load older messages</button> : null}

          {messages.map((message) => {
            const mine = currentUserId && message.senderId === currentUserId;
            return (
              <div key={message.id} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-2xl border px-3 py-2 ${mine ? "border-white/[0.15] bg-white/[0.08]" : "border-white/[0.08] bg-white/[0.03]"}`}>
                  {message.media ? (
                    <div className="space-y-2">
                      {message.media.type === "image" ? (
                        <img src={message.media.url} alt="Shared image" className="max-h-72 w-full rounded-xl border border-white/10 object-cover" />
                      ) : (
                        <video src={message.media.url} controls preload="metadata" className="max-h-72 w-full rounded-xl border border-white/10" />
                      )}
                      <span className="inline-flex rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] text-white/75">{expiresInLabel(message.media.expiresAt)}</span>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-white">{message.text}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showNewMessagesPill ? <button onClick={() => { scrollToBottom("smooth"); setShowNewMessagesPill(false); }} className="absolute inset-x-0 bottom-[4.9rem] mx-auto block w-fit rounded-full border border-[#6f1a2c]/55 bg-black/70 px-3 py-1 text-xs text-[#b96d81]">New messages</button> : null}
      </section>

      <footer className="z-20 border-t border-transparent bg-[rgba(0,0,0,0.86)] p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="mb-1 h-4 text-center text-[11px] text-white/60">{uploadStatus}</div>
        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] p-1.5">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => void handleAttach(event)} disabled={expired || uploading} />
          <button onClick={() => fileInputRef.current?.click()} disabled={expired || uploading} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80" aria-label="Attach image or video">+
          </button>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type a message" className="w-full bg-transparent px-2 text-base text-white outline-none placeholder:text-white/45" disabled={expired} />
          <button disabled={isSendDisabled} onClick={() => void send()} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(120,0,30,0.55)] text-[#7a001e]">➜</button>
        </div>
      </footer>
    </motion.main>
  );
}

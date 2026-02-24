"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ChatMessage = { id: string; senderId: string; text: string | null; createdAt: string };

type ConversationPayload = {
  conversation: { id: string; userAId: string; userBId: string; expiresAt: string };
  messages: ChatMessage[];
  nextCursor: string | null;
};

function daysLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
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
  const didInitialScrollRef = useRef(false);

  const isNearBottom = useCallback(() => {
    const node = messagesContainerRef.current;
    if (!node) {
      return true;
    }

    return node.scrollHeight - node.scrollTop - node.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const node = messagesContainerRef.current;
    if (!node) {
      return;
    }

    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const mergeMessages = useCallback((prev: ChatMessage[], incoming: ChatMessage[]) => {
    if (!incoming.length) {
      return prev;
    }

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

      if (response.status === 410) {
        setExpired(true);
        return;
      }

      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as ConversationPayload;
      setExpiresAt(data.conversation.expiresAt);
      setNextCursor(data.nextCursor);
      setMessages((prev) => (cursor ? [...data.messages, ...prev] : data.messages));

      const listResponse = await fetch("/api/chats/list", { cache: "no-store" });
      if (listResponse.ok) {
        const listData = (await listResponse.json()) as {
          conversations: { id: string; friendUser: { username: string; avatarUrl: string; id: string } }[];
        };
        const row = listData.conversations.find((item) => item.id === params.id);
        if (row) {
          setFriend(row.friendUser);
        }
      }

      const me = await fetch("/api/me");
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
    if (pollInFlightRef.current || expired || !isAuthenticated || !isPageVisible) {
      return;
    }

    pollInFlightRef.current = true;
    const wasNearBottom = isNearBottom();

    try {
      const newestCreatedAt = messages[messages.length - 1]?.createdAt;
      const query = newestCreatedAt ? `?after=${encodeURIComponent(newestCreatedAt)}` : "";
      const response = await fetch(`/api/chats/${params.id}/messages${query}`, { cache: "no-store" });

      if (response.status === 410) {
        setExpired(true);
        return;
      }

      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (!response.ok) {
        throw new Error("poll failed");
      }

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
    } catch (_error) {
      setPollDelayMs(5000);
    } finally {
      pollInFlightRef.current = false;
    }
  }, [expired, isAuthenticated, isNearBottom, isPageVisible, mergeMessages, messages, params.id, scrollToBottom]);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current || expired || !isAuthenticated || !isPageVisible) {
      return;
    }

    pollIntervalRef.current = setInterval(() => {
      void pollForNewMessages();
    }, pollDelayMs);
  }, [expired, isAuthenticated, isPageVisible, pollDelayMs, pollForNewMessages]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      if (!visible) {
        clearPolling();
      }
    };

    setIsPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearPolling]);

  useEffect(() => {
    clearPolling();
    if (!expired && isAuthenticated && isPageVisible) {
      startPolling();
    }

    return () => {
      clearPolling();
    };
  }, [clearPolling, expired, isAuthenticated, isPageVisible, startPolling]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      scrollToBottom("auto");
      return;
    }

    if (isNearBottom()) {
      scrollToBottom("smooth");
    }
  }, [isNearBottom, messages.length, scrollToBottom]);

  const send = async () => {
    if (!input.trim() || expired) {
      return;
    }

    const response = await fetch(`/api/chats/${params.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.trim() })
    });

    if (response.status === 410) {
      setExpired(true);
      return;
    }

    if (!response.ok) {
      return;
    }

    setInput("");
    await pollForNewMessages();
    scrollToBottom("smooth");
  };

  const left = useMemo(() => (expiresAt ? daysLeft(expiresAt) : 0), [expiresAt]);
  const isSendDisabled = !input.trim() || expired;
  const hasInput = input.trim().length > 0;

  const handleBack = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.push("/chats");
    }, 250);
  };

  return (
    <motion.main
      initial={{ x: 40, opacity: 0 }}
      animate={isExiting ? { x: 40, opacity: 0 } : { x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 flex h-dvh flex-col overflow-hidden bg-black text-white"
      style={{
        background: "#000"
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-white/[0.06] blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 10, 0], x: [0, -8, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-16 top-40 h-44 w-44 rounded-full border border-white/[0.08]"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 left-1/2 h-40 w-40 -translate-x-1/2 rounded-[2.5rem] border border-white/[0.06]"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 15% 10%, rgba(255,255,255,0.07) 0, rgba(255,255,255,0) 30%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.06) 0, rgba(255,255,255,0) 35%)"
          }}
        />
      </div>

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        className="z-20 border-b border-white/[0.1] bg-black/35 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.9rem)] backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={handleBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] backdrop-blur-md"
            aria-label="Back to chats"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M14.5 5.5 8 12l6.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2">
            <img
              src={friend?.avatarUrl || "https://placehold.co/40x40/111111/ffffff?text=U"}
              alt={friend?.username || "User avatar"}
              className="h-10 w-10 rounded-full border border-white/15 object-cover"
            />
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-white">{friend?.username ? `@${friend.username}` : "User"}</p>
              <p className="text-xs text-white/50">Private chat</p>
            </div>
          </div>

          <motion.button
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24, delay: 0.18 }}
            onClick={() => setShowExpiryInfo(true)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md ${
              left <= 2 ? "border-[#7a001e]/70 bg-[#7a001e]/20 text-[#f3a4bb]" : "border-white/15 bg-white/[0.05] text-white/80"
            }`}
            aria-label="Show chat expiration details"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            <span>{left}d</span>
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence>
        {showExpiryInfo ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExpiryInfo(false)}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-black p-5 text-left shadow-[0_18px_70px_rgba(0,0,0,0.65)]"
            >
              <p className="text-base font-semibold text-white">Chat expiration</p>
              <p className="mt-3 text-sm leading-7 text-white/75">
                This conversation stays active for <span className="font-semibold text-white">15 days</span> from the moment it starts.
                After that window, messages are automatically removed to keep the chat private.
              </p>
              <button
                onClick={() => setShowExpiryInfo(false)}
                className="mt-5 w-full rounded-2xl border border-white/15 bg-white/[0.06] py-2.5 text-sm font-medium text-white"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {expired ? <div className="px-4 pb-2 pt-4 text-center text-sm text-white/60">Chat expired</div> : null}

      <section className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={messagesContainerRef}
          onScroll={() => {
            if (isNearBottom()) {
              setShowNewMessagesPill(false);
            }
          }}
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 [scrollbar-width:thin] [scroll-behavior:smooth]"
        >
          {nextCursor ? (
            <button
              onClick={() => void loadMessages(nextCursor)}
              className="mb-4 w-full rounded-full border border-white/15 bg-white/[0.04] py-2 text-xs text-white/70 backdrop-blur"
            >
              Load older messages
            </button>
          ) : null}

          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const mine = currentUserId && message.senderId === currentUserId;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      mine
                        ? "border border-white/[0.15] bg-white/[0.08] text-white backdrop-blur-md"
                        : "border border-white/[0.08] bg-[rgba(255,255,255,0.03)] text-white/90"
                    }`}
                  >
                    {message.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[4.9rem] z-10 px-4">
          <AnimatePresence>
            {showNewMessagesPill ? (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  scrollToBottom("smooth");
                  setShowNewMessagesPill(false);
                }}
                className="pointer-events-auto mx-auto block rounded-full border border-[#6f1a2c]/55 bg-black/70 px-3 py-1 text-xs text-[#b96d81] backdrop-blur"
              >
                New messages
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      <motion.footer
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut", delay: 0.14 }}
        className="z-20 border-t border-transparent bg-[rgba(0,0,0,0.86)] p-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-lg"
        style={{
          borderImage: "linear-gradient(to right, rgba(255,255,255,0.02), rgba(255,255,255,0.16), rgba(255,255,255,0.02)) 1",
          boxShadow: "0 -28px 42px rgba(0,0,0,0.55)"
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] p-1.5 backdrop-blur-md">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a message"
            className="w-full bg-transparent px-4 text-base leading-6 text-white outline-none placeholder:text-white/45"
            disabled={expired}
          />
          <motion.button
            whileTap={isSendDisabled ? undefined : { scale: 0.92 }}
            whileHover={isSendDisabled ? undefined : { scale: 1.06 }}
            animate={
              isSendDisabled
                ? { opacity: 0.45, scale: 1, boxShadow: "0 0 0 rgba(120,0,30,0)" }
                : hasInput
                  ? { opacity: 1, scale: 1.1, boxShadow: "0 0 22px rgba(120,0,30,0.4)" }
                  : { opacity: 1, scale: 1, boxShadow: "0 0 0 rgba(120,0,30,0)" }
            }
            transition={{ duration: 0.2, ease: "easeOut" }}
            disabled={isSendDisabled}
            onClick={() => void send()}
            className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[rgba(120,0,30,0.55)] bg-transparent text-[#7a001e]"
            aria-label="Send message"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              whileTap={isSendDisabled ? undefined : { opacity: [0.2, 0], scale: 1.6 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(120,0,30,0.28)_0%,rgba(120,0,30,0)_70%)]"
            />
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M5 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>
      </motion.footer>
    </motion.main>
  );
}

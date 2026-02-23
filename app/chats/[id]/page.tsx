"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [friend, setFriend] = useState<{ username: string; avatarUrl: string; id: string } | null>(null);
  const [input, setInput] = useState("");
  const [expired, setExpired] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const loadMessages = useCallback(async (cursor?: string) => {
    const response = await fetch(`/api/chats/${params.id}/messages${cursor ? `?cursor=${cursor}` : ""}`, { cache: "no-store" });

    if (response.status === 410) {
      setExpired(true);
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
    }
  }, [params.id]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const send = async () => {
    if (!input.trim() || expired) {
      return;
    }

    const response = await fetch(`/api/chats/${params.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.trim() })
    });

    if (!response.ok) {
      return;
    }

    setInput("");
    await loadMessages();
  };

  const left = useMemo(() => (expiresAt ? daysLeft(expiresAt) : 0), [expiresAt]);

  return (
    <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-black px-4 py-5 text-white">
      <div className="mx-auto flex max-w-3xl flex-col rounded-3xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/[0.06] p-4">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => router.push("/chats")} className="rounded-lg border border-white/15 px-3 py-1 text-xs">
            Back
          </motion.button>
          <img src={friend?.avatarUrl || "https://placehold.co/36x36/111111/FFFFFF?text=%40"} alt={friend?.username ?? "User"} className="h-9 w-9 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">@{friend?.username ?? "chat"}</p>
          </div>
          <span className={`rounded-full border px-2 py-1 text-[11px] ${left <= 2 ? "border-[#FF2E63]/40 text-[#FF8FB1]" : "border-white/15 text-white/65"}`}>
            Days left: {left}
          </span>
        </div>

        {expired ? <div className="p-8 text-center text-sm text-white/65">This chat expired</div> : null}

        <div className="h-[62vh] overflow-y-auto px-3 py-4">
          {nextCursor ? (
            <button onClick={() => void loadMessages(nextCursor)} className="mb-3 w-full rounded-lg border border-white/15 py-2 text-xs text-white/70">
              Load older
            </button>
          ) : null}

          <AnimatePresence>
            {messages.map((message) => {
              const mine = currentUserId && message.senderId === currentUserId;
              return (
                <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl border px-3 py-2 text-sm ${mine ? "border-[#FF2E63]/25 bg-[#FF2E63]/12" : "border-white/[0.08] bg-white/[0.06]"}`}>
                    {message.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/40 p-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message"
              className="w-full bg-transparent px-2 text-sm outline-none placeholder:text-white/45"
              disabled={expired}
            />
            <motion.button whileTap={{ scale: 0.94 }} disabled={!input.trim() || expired} onClick={() => void send()} className="rounded-xl border border-white/20 px-3 py-2 text-xs disabled:opacity-40">
              Send
            </motion.button>
          </div>
        </div>
      </div>
    </motion.main>
  );
}

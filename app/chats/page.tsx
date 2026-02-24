"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

type SearchUser = { id: string; username: string; avatarUrl: string; bio: string };
type ConversationRow = {
  id: string;
  friendUser: { id: string; username: string; avatarUrl: string };
  lastMessage: { text: string; createdAt: string } | null;
  expiresAt: string;
};

function daysLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function ChatsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/chats/list", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { conversations: ConversationRow[] };
      setConversations(data.conversations ?? []);
    })();
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      void (async () => {
        const response = await fetch(`/api/chats/search?username=${encodeURIComponent(query.trim())}`);
        const data = (await response.json()) as { users: SearchUser[] };
        setResults(data.users ?? []);
        setSearching(false);
      })();
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? "")),
    [conversations]
  );

  const openConversation = async (userId: string) => {
    const response = await fetch("/api/chats/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: userId })
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { conversation: { id: string } };
    router.push(`/chats/${data.conversation.id}`);
  };

  return (
    <motion.main initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-screen overflow-hidden bg-[#030303] px-4 pb-14 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-15%] top-16 h-56 w-56 rounded-full bg-[#FF2E63]/18 blur-[110px]" />
        <div className="absolute right-[-20%] top-1/3 h-72 w-72 rounded-full bg-white/8 blur-[140px]" />
      </div>

      <header className="relative mx-auto flex w-full max-w-3xl items-center gap-3 pt-6">
        <HeaderMenuDrawer />
      </header>

      <div className="relative mx-auto mt-8 max-w-3xl">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">private messaging</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Chats</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/65">{sortedConversations.length} active</div>
        </div>

        <div>
          <label className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl transition-all duration-300 focus-within:border-[#FF2E63]/45 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_28px_rgba(255,46,99,0.22)]">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-white/60" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13 13l3.2 3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search username…"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
            />
          </label>

          <AnimatePresence>
            {query.trim().length >= 3 ? (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-3 space-y-2">
                {searching ? <p className="text-xs text-white/60">Searching…</p> : null}
                {results.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur"
                  >
                    <img src={item.avatarUrl || "https://placehold.co/48x48/111111/FFFFFF?text=%40"} alt={item.username} className="h-10 w-10 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">@{item.username}</p>
                      <p className="truncate text-xs text-white/60">{item.bio || "Verified friend"}</p>
                    </div>
                    <button onClick={() => void openConversation(item.id)} className="rounded-xl border border-[#FF2E63]/35 bg-[#FF2E63]/12 px-3 py-1 text-xs text-white transition hover:border-[#FF2E63]/70 hover:bg-[#FF2E63]/20">
                      Message
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-8">
          <h2 className="text-sm tracking-wide text-white/75">Recent Chats</h2>
          <div className="mt-3 space-y-2.5">
            <AnimatePresence>
              {sortedConversations.map((chat, index) => {
                const left = daysLeft(chat.expiresAt);
                return (
                  <motion.button
                    key={chat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => router.push(`/chats/${chat.id}`)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-left backdrop-blur transition hover:border-[#FF2E63]/45 hover:bg-white/[0.05]"
                  >
                    <img src={chat.friendUser.avatarUrl || "https://placehold.co/40x40/111111/FFFFFF?text=%40"} alt={chat.friendUser.username} className="h-9 w-9 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">@{chat.friendUser.username}</p>
                      <p className="truncate text-xs text-white/55">{chat.lastMessage?.text || "Start your conversation"}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[11px] ${left <= 2 ? "border-[#FF2E63]/40 text-[#FF8FB1]" : "border-white/15 text-white/65"}`}>
                      {left} days left
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>

            {!sortedConversations.length ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-sm text-white/60">
                No chats yet. Start by searching a username.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.main>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { SearchUser } from "@/components/chats/types";

type ChatSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  searching: boolean;
  results: SearchUser[];
  onOpenConversation: (userId: string) => void | Promise<void>;
};

function Avatar({ user }: { user: SearchUser }) {
  const [failed, setFailed] = useState(false);
  const fallback = (user.username?.[0] ?? "U").toUpperCase();

  if (user.avatarUrl && !failed) {
    return <img src={user.avatarUrl} alt={user.username} onError={() => setFailed(true)} className="h-11 w-11 rounded-full object-cover" />;
  }

  return <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm text-white/80">{fallback}</div>;
}

export function ChatSearchBar({ query, onQueryChange, searching, results, onOpenConversation }: ChatSearchBarProps) {
  const showResults = query.trim().length >= 3;

  return (
    <section className="mb-9">
      <label className="flex items-center gap-3 border-b border-white/12 pb-3 text-white/70 focus-within:border-white/26 focus-within:text-white">
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
          <circle cx="9" cy="9" r="5.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="m13 13 3.2 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by username"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
        />
        {query ? (
          <button type="button" onClick={() => onQueryChange("")} className="text-[11px] uppercase tracking-[0.18em] text-white/40 hover:text-white/70">
            Clear
          </button>
        ) : null}
      </label>

      <AnimatePresence>
        {showResults ? (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="pt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Search</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">{searching ? "Searching" : `${results.length} found`}</p>
            </div>

            {searching ? <p className="py-4 text-sm text-white/45">Searching users…</p> : null}

            {!searching && results.length === 0 ? <p className="py-5 text-sm text-white/45">No matching usernames.</p> : null}

            {!searching
              ? results.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-white/8"
                  >
                    <div className="flex items-center gap-3 py-3.5">
                      <Avatar user={user} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-white">{user.username}</p>
                        <p className="truncate text-[13px] text-white/45">{user.bio || "Start a private conversation"}</p>
                      </div>
                      <button type="button" onClick={() => void onOpenConversation(user.id)} className="text-[11px] uppercase tracking-[0.16em] text-[#bb7385] hover:text-[#d79aa9]">
                        Message
                      </button>
                    </div>
                  </motion.div>
                ))
              : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

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

const avatarGradients = [
  "linear-gradient(135deg,#181112,#44212b)",
  "linear-gradient(135deg,#111318,#243041)",
  "linear-gradient(135deg,#181411,#3a2819)",
  "linear-gradient(135deg,#121214,#302435)",
];

function getAvatarBackground(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function SearchAvatar({ user }: { user: SearchUser }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = user.username?.charAt(0)?.toUpperCase() ?? "V";

  if (user.avatarUrl && !imageFailed) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.username}
        onError={() => setImageFailed(true)}
        className="h-11 w-11 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white/88"
      style={{ background: getAvatarBackground(user.id || user.username) }}
    >
      {initial}
    </div>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="skeleton-shimmer h-11 w-11 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="skeleton-shimmer h-3.5 w-28 rounded-full" />
        <div className="skeleton-shimmer h-3 w-40 rounded-full" />
      </div>
      <div className="skeleton-shimmer h-3 w-12 rounded-full" />
    </div>
  );
}

export function ChatSearchBar({ query, onQueryChange, searching, results, onOpenConversation }: ChatSearchBarProps) {
  const showResults = query.trim().length >= 3;

  return (
    <section className="mb-8">
      <label className="flex items-center gap-3 border-b border-white/10 pb-3 text-white/72 transition-colors focus-within:border-[#7a2438]/55 focus-within:text-white">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-white/34">
          <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" aria-hidden>
            <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13.2 13.2 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>

        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by username"
          className="min-w-0 flex-1 bg-transparent py-1 text-[15px] font-medium text-white outline-none placeholder:text-white/24"
          style={{ caretColor: "#8b2a42" }}
        />

        <AnimatePresence initial={false}>
          {query ? (
            <motion.button
              key="clear"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              onClick={() => onQueryChange("")}
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/38 transition hover:text-white/64"
              aria-label="Clear search"
            >
              Clear
            </motion.button>
          ) : null}
        </AnimatePresence>
      </label>

      <AnimatePresence>
        {showResults ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="pt-5"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-white/32">Search</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/28">
                {searching ? "Searching" : `${results.length} found`}
              </p>
            </div>

            <div>
              {searching ? (
                <>
                  <SearchResultSkeleton />
                  <SearchResultSkeleton />
                </>
              ) : results.length ? (
                results.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: index * 0.03, ease: "easeOut" }}
                    className="border-b border-white/6 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 py-3.5">
                      <SearchAvatar user={user} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-white">@{user.username}</p>
                        <p className="mt-1 truncate text-[13px] text-white/42">
                          {user.bio || "Start a private conversation."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void onOpenConversation(user.id)}
                        className="shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] text-[#b26779] transition hover:text-[#d998a8]"
                      >
                        Message
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium text-white/68">No matching usernames.</p>
                  <p className="mt-1 text-[13px] text-white/38">Try a more exact handle to begin a conversation.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

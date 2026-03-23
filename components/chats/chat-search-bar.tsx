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
  "linear-gradient(135deg,#1a0b0f,#4d1626)",
  "linear-gradient(135deg,#0b1018,#1b2637)",
  "linear-gradient(135deg,#110f08,#322512)",
  "linear-gradient(135deg,#090f0c,#173027)",
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
        className="h-12 w-12 rounded-2xl border border-white/10 object-cover shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
      />
    );
  }

  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-sm font-semibold text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
      style={{ background: getAvatarBackground(user.id || user.username) }}
    >
      {initial}
    </div>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[24px] border border-white/8 bg-white/[0.04] px-3.5 py-3.5 backdrop-blur-2xl">
      <div className="skeleton-shimmer h-12 w-12 rounded-2xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="skeleton-shimmer h-3.5 w-32 rounded-full" />
        <div className="skeleton-shimmer h-3 w-40 rounded-full" />
      </div>
      <div className="skeleton-shimmer h-9 w-20 rounded-full" />
    </div>
  );
}

export function ChatSearchBar({ query, onQueryChange, searching, results, onOpenConversation }: ChatSearchBarProps) {
  const showResults = query.trim().length >= 3;

  return (
    <section className="relative z-20 mb-6">
      <div className="rounded-[30px] border border-white/10 bg-white/[0.055] p-2 backdrop-blur-[28px] shadow-[0_20px_70px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <label className="flex items-center gap-3 rounded-[24px] border border-white/6 bg-black/20 px-4 py-3.5 transition duration-300 focus-within:border-[#8b2a42]/40 focus-within:bg-white/[0.045] focus-within:shadow-[0_0_0_1px_rgba(139,42,66,0.16),0_12px_32px_rgba(88,18,35,0.22)]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.05] text-white/38">
            <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" aria-hidden>
              <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="M13.2 13.2 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-white/30">Search users</p>
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by username"
              className="w-full bg-transparent text-[15px] font-medium text-white outline-none placeholder:text-white/26"
              style={{ caretColor: "#9d314a" }}
            />
          </div>
          <AnimatePresence initial={false}>
            {query ? (
              <motion.button
                key="clear"
                type="button"
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.86 }}
                transition={{ duration: 0.16 }}
                onClick={() => onQueryChange("")}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/52 transition hover:border-white/20 hover:text-white/74 active:scale-95"
                aria-label="Clear search"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
                  <path d="M4 4l8 8M12 4 4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </motion.button>
            ) : null}
          </AnimatePresence>
        </label>
      </div>

      <AnimatePresence>
        {showResults ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-3 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,17,17,0.92),rgba(10,10,10,0.84))] p-2 shadow-[0_32px_90px_rgba(0,0,0,0.45)] backdrop-blur-[30px]"
          >
            <div className="mb-2 flex items-center justify-between px-2 py-1 text-[11px] uppercase tracking-[0.22em] text-white/34">
              <span>Results</span>
              <span>{searching ? "Searching" : `${results.length} found`}</span>
            </div>

            <div className="space-y-2">
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
                    transition={{ duration: 0.22, delay: index * 0.03, ease: "easeOut" }}
                    className="group flex items-center gap-3 rounded-[24px] border border-white/8 bg-white/[0.04] px-3.5 py-3.5 backdrop-blur-2xl transition duration-300 hover:border-white/12 hover:bg-white/[0.06] active:scale-[0.992]"
                  >
                    <SearchAvatar user={user} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-white">@{user.username}</p>
                      </div>
                      <p className="mt-1 truncate text-[13px] leading-5 text-white/46">{user.bio || "Start a private conversation."}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onOpenConversation(user.id)}
                      className="inline-flex shrink-0 items-center rounded-full border border-[#8b2a42]/30 bg-[linear-gradient(180deg,rgba(121,34,56,0.48),rgba(80,20,37,0.38))] px-4 py-2 text-[12px] font-semibold text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_25px_rgba(70,14,29,0.28)] transition duration-300 hover:border-[#a23a56]/40 hover:text-white active:scale-95"
                    >
                      Message
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center">
                  <p className="text-sm font-medium text-white/72">No matching usernames.</p>
                  <p className="mt-1 text-[13px] text-white/40">Try a more exact handle to start a new conversation.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

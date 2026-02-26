"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

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

const transition = { duration: 0.65, ease: "easeOut" as const };

function initials(value: string) {
  return (value?.[0] ?? "U").toUpperCase();
}

function Avatar({ user, size = "h-11 w-11" }: { user: Pick<UserCard, "avatarUrl" | "username">; size?: string }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.username} className={`${size} rounded-full border border-white/20 object-cover shadow-[0_8px_22px_rgba(0,0,0,0.35)]`} />;
  }

  return <div className={`${size} flex items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm text-white/90`}>{initials(user.username)}</div>;
}

const glassPanel = "border border-white/15 bg-[linear-gradient(140deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06)_45%,rgba(255,255,255,0.02))] shadow-[0_16px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl";
const softButton = "rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition hover:border-white/40 hover:bg-white/10";

export function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<UserCard[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<UserCard[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserCard[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserCard | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const incomingCount = requests.length;

  const loadFriends = async () => {
    const response = await fetch("/api/friends/list", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { friends: UserCard[] };
    setFriends(payload.friends);
  };

  const loadRequests = async () => {
    const response = await fetch("/api/friends/requests", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { requests: FriendRequestItem[] };
    setRequests(payload.requests);
  };

  const loadBlocked = async () => {
    const response = await fetch("/api/friends/blocked", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { blocked: UserCard[] };
    setBlockedUsers(payload.blocked);
  };

  useEffect(() => {
    void loadFriends();
    void loadRequests();
    void loadBlocked();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (search.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const response = await fetch(`/api/friends/search?username=${encodeURIComponent(search.trim())}`, { cache: "no-store" });
      if (!response.ok) {
        setSearchResults([]);
        return;
      }

      const payload = (await response.json()) as { users: UserCard[] };
      setSearchResults(payload.users);
    }, 220);

    return () => clearTimeout(timeout);
  }, [search]);

  const requestMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of requests) map.set(item.sender.id, item.id);
    return map;
  }, [requests]);

  const tabItems = useMemo(() => ([
    { key: "friends" as const, label: "friends", count: friends.length },
    { key: "requests" as const, label: "requests", count: requests.length },
    { key: "blocked" as const, label: "blocked", count: blockedUsers.length }
  ]), [blockedUsers.length, friends.length, requests.length]);

  const refreshAll = async () => {
    await Promise.all([loadFriends(), loadRequests(), loadBlocked()]);
  };

  const sendRequest = async (receiverId: string) => {
    const response = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId })
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Unable to send request." }))) as { error?: string };
      setMessage(payload.error ?? "Unable to send request.");
      return;
    }

    setSearchResults((prev) => prev.map((item) => (item.id === receiverId ? { ...item, relationship: "pending" } : item)));
    setSelectedUser((prev) => (prev?.id === receiverId ? { ...prev, relationship: "pending" } : prev));
    setMessage("Request sent.");
    await refreshAll();
  };

  const actOnRequest = async (requestId: string, action: "accept" | "reject") => {
    const response = await fetch(`/api/friends/requests/${requestId}/${action}`, { method: "POST" });
    if (!response.ok) return;

    setRequests((prev) => prev.filter((item) => item.id !== requestId));
    await refreshAll();
  };

  const removeFriend = async (userId: string) => {
    await fetch("/api/friends/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    await refreshAll();
  };

  const blockUser = async (userId: string) => {
    await fetch("/api/friends/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    setSearchResults((prev) => prev.map((item) => (item.id === userId ? { ...item, relationship: "blocked" } : item)));
    setSelectedUser((prev) => (prev?.id === userId ? { ...prev, relationship: "blocked" } : prev));
    await refreshAll();
  };

  const unblockUser = async (userId: string) => {
    await fetch("/api/friends/unblock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    setSearchResults((prev) => prev.map((item) => (item.id === userId ? { ...item, relationship: "none" } : item)));
    setSelectedUser((prev) => (prev?.id === userId ? { ...prev, relationship: "none" } : prev));
    await refreshAll();
  };

  const statusButton = (user: UserCard) => {
    if (user.relationship === "friends") return <button className={`${softButton} opacity-65`} disabled>Friends</button>;
    if (user.relationship === "pending") return <button className={`${softButton} opacity-65`} disabled>Pending</button>;
    if (user.relationship === "blocked") return <button className={`${softButton} opacity-65`} disabled>Blocked</button>;

    return <button onClick={() => void sendRequest(user.id)} className={softButton}>Add</button>;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 pb-20 pt-10 text-white md:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-1/2 top-[-14rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-fuchsia-500/15 blur-[110px]" />
        <div className="absolute bottom-[-8rem] right-[-5rem] h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-[95px]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={transition} className={`mb-7 rounded-3xl p-5 md:p-6 ${glassPanel}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Friends</h1>
              <p className="mt-1 text-sm text-white/65">Modern connection hub with clean liquid-glass layering.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-[#FF2E63]" />
              {incomingCount} pending request{incomingCount === 1 ? "" : "s"}
            </div>
          </div>
        </motion.header>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={transition} className={`mb-8 rounded-3xl p-4 md:p-5 ${glassPanel}`}>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative overflow-hidden rounded-2xl border px-3 py-3 text-left transition ${activeTab === tab.key ? "border-white/45 bg-white/20" : "border-white/15 bg-white/[0.03] hover:border-white/30"}`}
              >
                <span className="block text-[11px] uppercase tracking-[0.14em] text-white/60">{tab.label}</span>
                <span className="mt-1 block text-lg font-medium text-white">{tab.count}</span>
                {activeTab === tab.key ? <motion.span layoutId="friends-active-tab" className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-fuchsia-300/90 to-cyan-300/90" /> : null}
              </button>
            ))}
          </div>

          <div className="relative">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" fill="none" />
              <line x1="16.2" y1="16.2" x2="21" y2="21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <motion.input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search username..."
              className="w-full rounded-2xl border border-white/20 bg-white/[0.07] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/45"
              whileFocus={{ scale: 1.01 }}
              transition={{ duration: 0.25 }}
            />
          </div>

          <AnimatePresence>
            {searchResults.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={transition} className="mt-3 space-y-2">
                {searchResults.map((item) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedUser(item)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={transition}
                    whileHover={{ scale: 1.01 }}
                    className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-3 text-left transition hover:border-white/30 hover:bg-white/[0.11]"
                  >
                    <Avatar user={item} size="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{item.username}</p>
                      <p className="truncate text-xs text-white/60">@{item.username}</p>
                    </div>
                    <div onClick={(event) => event.stopPropagation()}>{statusButton(item)}</div>
                  </motion.button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>

        <AnimatePresence mode="wait">
          {activeTab === "friends" ? (
            <motion.section key="friends-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={transition} className="space-y-3">
              {friends.length ? friends.map((friend) => (
                <motion.article
                  key={friend.id}
                  whileHover={{ scale: 1.008 }}
                  transition={{ duration: 0.22 }}
                  className={`flex min-h-[76px] items-center gap-3 rounded-2xl px-4 py-3 ${glassPanel}`}
                >
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSelectedUser({ ...friend, relationship: "friends" })}>
                    <Avatar user={friend} size="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{friend.username}</p>
                      <p className="truncate text-xs text-white/60">@{friend.username}</p>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => setMessage("Messaging is coming soon.")} className={softButton}>Message</button>
                    <button onClick={() => void removeFriend(friend.id)} className={softButton}>Remove</button>
                    <button onClick={() => void blockUser(friend.id)} className={softButton}>Block</button>
                  </div>
                </motion.article>
              )) : <div className={`rounded-2xl p-12 text-center text-white/70 ${glassPanel}`}>No connections yet. Start searching.</div>}
            </motion.section>
          ) : activeTab === "blocked" ? (
            <motion.section key="blocked-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={transition} className="space-y-3">
              {blockedUsers.length ? blockedUsers.map((blockedUser) => (
                <motion.article
                  key={blockedUser.id}
                  whileHover={{ scale: 1.008 }}
                  transition={{ duration: 0.22 }}
                  className={`flex min-h-[76px] items-center gap-3 rounded-2xl px-4 py-3 ${glassPanel}`}
                >
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSelectedUser({ ...blockedUser, relationship: "blocked" })}>
                    <Avatar user={blockedUser} size="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{blockedUser.username}</p>
                      <p className="truncate text-xs text-white/60">@{blockedUser.username}</p>
                    </div>
                  </button>
                  <button onClick={() => void unblockUser(blockedUser.id)} className={softButton}>Unblock</button>
                </motion.article>
              )) : <div className={`rounded-2xl p-10 text-center text-white/70 ${glassPanel}`}>No blocked users.</div>}
            </motion.section>
          ) : (
            <motion.section key="requests-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={transition} className="space-y-3">
              {requests.length ? requests.map((request) => (
                <motion.article key={request.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} transition={transition} className={`flex items-center gap-3 rounded-2xl p-3 ${glassPanel}`}>
                  <button type="button" onClick={() => setSelectedUser({ ...request.sender, relationship: "none" })}><Avatar user={request.sender} /></button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">@{request.sender.username}</p>
                    <p className="truncate text-xs text-white/60">{request.sender.bio || "Wants to connect."}</p>
                  </div>
                  <button onClick={() => void actOnRequest(request.id, "accept")} className="rounded-xl border border-fuchsia-300/65 bg-fuchsia-300/15 px-3 py-1.5 text-xs text-white">Accept</button>
                  <button onClick={() => void actOnRequest(request.id, "reject")} className={softButton}>Reject</button>
                </motion.article>
              )) : <div className={`rounded-2xl p-10 text-center text-white/70 ${glassPanel}`}>No requests.</div>}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedUser ? (
          <>
            <motion.button key="backdrop" className="fixed inset-0 z-40 bg-black/65 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} aria-label="Close profile modal" />
            <motion.div key="modal" initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.25, ease: "easeOut" }} className={`fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6 ${glassPanel}`}>
              <button className="absolute right-3 top-3 rounded-full border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/70" onClick={() => setSelectedUser(null)}>✕</button>
              <div className="flex flex-col items-center text-center">
                <Avatar user={selectedUser} size="h-20 w-20" />
                <p className="mt-3 text-lg text-white">@{selectedUser.username}</p>
                <p className="mt-1 max-w-[280px] text-sm text-white/70">{selectedUser.bio?.slice(0, 120) || "No bio yet."}</p>
                {selectedUser.verified ? <span className="mt-2 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-white/80">Verified</span> : null}
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {selectedUser.relationship === "pending" ? <button disabled className={`${softButton} opacity-65`}>Pending</button> : null}
                  {selectedUser.relationship === "friends" ? (
                    <>
                      <button onClick={() => setMessage("Messaging is coming soon.")} className={softButton}>Message</button>
                      <button onClick={() => void removeFriend(selectedUser.id)} className={softButton}>Remove</button>
                      <button onClick={() => void blockUser(selectedUser.id)} className={softButton}>Block</button>
                    </>
                  ) : null}
                  {selectedUser.relationship === "blocked" ? <button onClick={() => void unblockUser(selectedUser.id)} className={softButton}>Unblock</button> : null}
                  {selectedUser.relationship === "none" || !selectedUser.relationship ? <button onClick={() => void sendRequest(selectedUser.id)} className={softButton}>Add</button> : null}
                  {requestMap.get(selectedUser.id) ? (
                    <>
                      <button onClick={() => void actOnRequest(requestMap.get(selectedUser.id)!, "accept")} className="rounded-xl border border-fuchsia-300/65 bg-fuchsia-300/15 px-3 py-2 text-xs text-white">Accept</button>
                      <button onClick={() => void actOnRequest(requestMap.get(selectedUser.id)!, "reject")} className={softButton}>Reject</button>
                    </>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {message ? (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs text-white/90 backdrop-blur-xl" onClick={() => setMessage(null)}>
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

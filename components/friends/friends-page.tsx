"use client";

import { HeaderMenuDrawer } from "@/components/header-menu-drawer";
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

type Tab = "friends" | "blocked" | "requests";

const transition = { duration: 0.55, ease: "easeOut" as const };
const frostedShell =
  "border border-[#ffc6d7]/20 bg-gradient-to-br from-[#5f1029]/50 via-[#3a0f20]/35 to-[#14060d]/75 backdrop-blur-2xl shadow-[0_30px_90px_rgba(20,2,10,0.7)]";
const frostedCard =
  "border border-white/20 bg-gradient-to-br from-white/[0.16] via-white/[0.07] to-white/[0.03] backdrop-blur-xl shadow-[0_18px_55px_rgba(0,0,0,0.45)]";
const glassPill =
  "rounded-full border border-white/25 bg-white/[0.10] text-white/90 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_10px_30px_rgba(0,0,0,0.35)] transition";
const actionButton =
  "rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-xs text-white/85 backdrop-blur-md transition hover:border-white/50 hover:bg-white/[0.16]";

function initials(value: string) {
  return (value?.[0] ?? "U").toUpperCase();
}

function Avatar({ user, size = "h-11 w-11" }: { user: Pick<UserCard, "avatarUrl" | "username">; size?: string }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.username} className={`${size} rounded-full border border-white/35 object-cover shadow-[0_8px_24px_rgba(0,0,0,0.4)]`} />;
  }

  return <div className={`${size} flex items-center justify-center rounded-full border border-white/30 bg-white/[0.15] text-sm text-white`}>{initials(user.username)}</div>;
}

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
    if (user.relationship === "friends") return <button className={`${actionButton} opacity-60`} disabled>Friends</button>;
    if (user.relationship === "pending") return <button className={`${actionButton} opacity-60`} disabled>Pending</button>;
    if (user.relationship === "blocked") return <button className={`${actionButton} opacity-60`} disabled>Blocked</button>;
    return <button onClick={() => void sendRequest(user.id)} className={actionButton}>Add</button>;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#12040c] px-4 pb-20 pt-8 text-white md:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-90 [background:radial-gradient(circle_at_8%_8%,rgba(255,84,133,0.28),transparent_38%),radial-gradient(circle_at_92%_15%,rgba(142,9,49,0.38),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(96,18,39,0.45),transparent_46%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={transition} className={`mb-6 rounded-[28px] p-3 ${frostedShell}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <HeaderMenuDrawer />
              <div className="hidden rounded-full border border-white/20 bg-white/[0.1] px-3 py-1 text-xs text-white/85 backdrop-blur-xl md:block">{incomingCount} requests</div>
            </div>
            <label className={`relative flex-1 ${glassPill}`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" fill="none" />
                <line x1="16.2" y1="16.2" x2="21" y2="21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <motion.input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search username..."
                className="h-12 w-full rounded-full bg-transparent py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/55"
                whileFocus={{ scale: 1.01 }}
              />
            </label>
          </div>
        </motion.header>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={transition} className={`mb-6 flex gap-2 rounded-full p-2 ${frostedCard}`}>
          {(["friends", "blocked", "requests"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className="relative flex-1 rounded-full px-4 py-2.5 text-sm font-medium capitalize text-white/85">
              {activeTab === tab ? <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full border border-white/25 bg-white/[0.17]" transition={{ type: "spring", bounce: 0.24, duration: 0.45 }} /> : null}
              <span className="relative z-10">{tab}</span>
            </button>
          ))}
        </motion.div>

        <AnimatePresence>
          {searchResults.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={transition} className={`mb-6 space-y-2 rounded-3xl p-3 ${frostedCard}`}>
              {searchResults.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedUser(item)}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-3 text-left transition hover:bg-white/[0.12]"
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

        <AnimatePresence mode="wait">
          {activeTab === "friends" ? (
            <motion.section key="friends-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={transition} className="space-y-3">
              {friends.length ? friends.map((friend, index) => (
                <motion.article
                  key={friend.id}
                  layout
                  initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ...transition, delay: index * 0.03 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className={`flex min-h-[84px] items-center gap-3 rounded-3xl px-4 py-3 ${frostedCard}`}
                >
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSelectedUser({ ...friend, relationship: "friends" })}>
                    <Avatar user={friend} size="h-11 w-11" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{friend.username}</p>
                      <p className="truncate text-xs text-white/60">@{friend.username}</p>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => setMessage("Messaging is coming soon.")} className={actionButton}>Message</button>
                    <button onClick={() => void removeFriend(friend.id)} className={actionButton}>Remove</button>
                    <button onClick={() => void blockUser(friend.id)} className={actionButton}>Block</button>
                  </div>
                </motion.article>
              )) : <div className={`rounded-3xl p-12 text-center text-white/70 ${frostedCard}`}>No connections yet. Start searching.</div>}
            </motion.section>
          ) : activeTab === "blocked" ? (
            <motion.section key="blocked-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={transition} className="space-y-3">
              {blockedUsers.length ? blockedUsers.map((blockedUser, index) => (
                <motion.article key={blockedUser.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: index * 0.03 }} className={`flex min-h-[82px] items-center gap-3 rounded-3xl px-4 py-3 ${frostedCard}`}>
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSelectedUser({ ...blockedUser, relationship: "blocked" })}>
                    <Avatar user={blockedUser} size="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{blockedUser.username}</p>
                      <p className="truncate text-xs text-white/60">@{blockedUser.username}</p>
                    </div>
                  </button>
                  <button onClick={() => void unblockUser(blockedUser.id)} className={actionButton}>Unblock</button>
                </motion.article>
              )) : <div className={`rounded-3xl p-10 text-center text-white/70 ${frostedCard}`}>No blocked users.</div>}
            </motion.section>
          ) : (
            <motion.section key="requests-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={transition} className="space-y-3">
              {requests.length ? requests.map((request, index) => (
                <motion.article key={request.id} layout initial={{ opacity: 0, y: 12, x: -12 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ ...transition, delay: index * 0.03 }} className={`flex items-center gap-3 rounded-3xl p-3 ${frostedCard}`}>
                  <button type="button" onClick={() => setSelectedUser({ ...request.sender, relationship: "none" })}><Avatar user={request.sender} /></button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">@{request.sender.username}</p>
                    <p className="truncate text-xs text-white/60">{request.sender.bio || "Wants to connect."}</p>
                  </div>
                  <button onClick={() => void actOnRequest(request.id, "accept")} className="rounded-full border border-[#ff8fb0]/45 bg-[#ff4d7d]/30 px-3 py-1.5 text-xs text-white backdrop-blur-md">Accept</button>
                  <button onClick={() => void actOnRequest(request.id, "reject")} className={actionButton}>Reject</button>
                </motion.article>
              )) : <div className={`rounded-3xl p-10 text-center text-white/70 ${frostedCard}`}>No requests.</div>}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedUser ? (
          <>
            <motion.button key="backdrop" className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} aria-label="Close profile modal" />
            <motion.div key="modal" initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.25, ease: "easeOut" }} className={`fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6 ${frostedCard}`}>
              <button className="absolute right-3 top-3 rounded-full border border-white/20 bg-white/[0.08] px-2 py-1 text-xs text-white/70 backdrop-blur-md" onClick={() => setSelectedUser(null)}>✕</button>
              <div className="flex flex-col items-center text-center">
                <Avatar user={selectedUser} size="h-20 w-20" />
                <p className="mt-3 text-lg text-white">@{selectedUser.username}</p>
                <p className="mt-1 max-w-[280px] text-sm text-white/65">{selectedUser.bio?.slice(0, 120) || "No bio yet."}</p>
                {selectedUser.verified ? <span className="mt-2 rounded-full border border-white/20 bg-white/[0.08] px-2 py-1 text-[11px] text-white/75 backdrop-blur-md">Verified</span> : null}
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {selectedUser.relationship === "pending" ? <button disabled className={`${actionButton} opacity-60`}>Pending</button> : null}
                  {selectedUser.relationship === "friends" ? (
                    <>
                      <button onClick={() => setMessage("Messaging is coming soon.")} className={actionButton}>Message</button>
                      <button onClick={() => void removeFriend(selectedUser.id)} className={actionButton}>Remove</button>
                      <button onClick={() => void blockUser(selectedUser.id)} className={actionButton}>Block</button>
                    </>
                  ) : null}
                  {selectedUser.relationship === "blocked" ? <button onClick={() => void unblockUser(selectedUser.id)} className={actionButton}>Unblock</button> : null}
                  {selectedUser.relationship === "none" || !selectedUser.relationship ? <button onClick={() => void sendRequest(selectedUser.id)} className={actionButton}>Add</button> : null}
                  {requestMap.get(selectedUser.id) ? (
                    <>
                      <button onClick={() => void actOnRequest(requestMap.get(selectedUser.id)!, "accept")} className="rounded-full border border-[#ff8fb0]/45 bg-[#ff4d7d]/30 px-3 py-2 text-xs text-white backdrop-blur-md">Accept</button>
                      <button onClick={() => void actOnRequest(requestMap.get(selectedUser.id)!, "reject")} className={actionButton}>Reject</button>
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
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/20 bg-white/[0.09] px-4 py-2 text-xs text-white/85 backdrop-blur-lg" onClick={() => setMessage(null)}>
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

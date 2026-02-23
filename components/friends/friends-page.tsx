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

type Tab = "friends" | "requests";

const transition = { duration: 0.7, ease: "easeOut" as const };

function initials(value: string) {
  return (value?.[0] ?? "U").toUpperCase();
}

function Avatar({ user, size = "h-11 w-11" }: { user: Pick<UserCard, "avatarUrl" | "username">; size?: string }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.username} className={`${size} rounded-full border border-white/10 object-cover`} />;
  }

  return <div className={`${size} flex items-center justify-center rounded-full border border-white/10 bg-[#171717] text-sm text-white/80`}>{initials(user.username)}</div>;
}

export function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<UserCard[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserCard[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserCard | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const incomingCount = requests.length;

  const loadFriends = async () => {
    const response = await fetch("/api/friends/list", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as { friends: UserCard[] };
    setFriends(payload.friends);
  };

  const loadRequests = async () => {
    const response = await fetch("/api/friends/requests", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { requests: FriendRequestItem[] };
    setRequests(payload.requests);
  };

  useEffect(() => {
    void loadFriends();
    void loadRequests();
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
    for (const item of requests) {
      map.set(item.sender.id, item.id);
    }
    return map;
  }, [requests]);

  const refreshAll = async () => {
    await Promise.all([loadFriends(), loadRequests()]);
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
    if (!response.ok) {
      return;
    }

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

  const statusButton = (user: UserCard) => {
    if (user.relationship === "friends") {
      return <button className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60" disabled>Friends</button>;
    }

    if (user.relationship === "pending") {
      return <button className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60" disabled>Pending</button>;
    }

    if (user.relationship === "blocked") {
      return <button className="rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/60" disabled>Blocked</button>;
    }

    return <button onClick={() => void sendRequest(user.id)} className="rounded-xl border border-white/20 px-3 py-1.5 text-xs text-white transition hover:border-white/45">Add</button>;
  };

  return (
    <main className="min-h-screen bg-black px-4 pb-20 pt-10 text-white md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="mb-7 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Friends</h1>
          <div className="rounded-full border border-white/10 bg-[#111] px-3 py-1 text-xs text-white/80">{incomingCount} requests</div>
        </motion.header>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="mb-6 flex gap-6 border-b border-white/10">
          {(["friends", "requests"] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className="relative pb-3 text-sm capitalize text-white/80 transition hover:text-white">
              {tab}
              {activeTab === tab ? <motion.span layoutId="friends-active-tab" className="absolute inset-x-0 -bottom-px h-[2px] bg-[#FF2E63]" /> : null}
            </button>
          ))}
        </motion.div>

        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="mb-8 rounded-2xl border border-white/[0.06] bg-[#111] p-4">
          <motion.input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search username..."
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-white/35"
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.25 }}
          />

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
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-left"
                  >
                    <Avatar user={item} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">@{item.username}</p>
                      <p className="truncate text-xs text-white/55">{item.bio || "No bio yet"}</p>
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
            <motion.section key="friends-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={transition}>
              {friends.length ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {friends.map((friend) => (
                    <motion.article
                      key={friend.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-2xl border border-white/[0.06] bg-[#111] p-4"
                    >
                      <button type="button" className="w-full text-left" onClick={() => setSelectedUser({ ...friend, relationship: "friends" })}>
                        <Avatar user={friend} size="h-14 w-14" />
                        <p className="mt-3 truncate text-sm text-white">@{friend.username}</p>
                        <p className="text-xs text-white/55">{friend.verified ? "Verified" : "Member"}</p>
                      </button>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => setMessage("Messaging is coming soon.")} className="rounded-xl border border-white/15 px-2.5 py-1 text-xs text-white/80">Message</button>
                        <button onClick={() => void removeFriend(friend.id)} className="rounded-xl border border-white/15 px-2.5 py-1 text-xs text-white/80">Remove</button>
                        <button onClick={() => void blockUser(friend.id)} className="rounded-xl border border-white/15 px-2.5 py-1 text-xs text-white/80">Block</button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-12 text-center text-white/65">No connections yet. Start searching.</div>
              )}
            </motion.section>
          ) : (
            <motion.section key="requests-tab" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={transition} className="space-y-3">
              {requests.length ? requests.map((request) => (
                <motion.article key={request.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} transition={transition} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#111] p-3">
                  <button type="button" onClick={() => setSelectedUser({ ...request.sender, relationship: "none" })}><Avatar user={request.sender} /></button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-white">@{request.sender.username}</p>
                    <p className="truncate text-xs text-white/55">{request.sender.bio || "Wants to connect."}</p>
                  </div>
                  <button onClick={() => void actOnRequest(request.id, "accept")} className="rounded-xl border border-[#FF2E63] px-3 py-1.5 text-xs text-white">Accept</button>
                  <button onClick={() => void actOnRequest(request.id, "reject")} className="rounded-xl border border-white/20 px-3 py-1.5 text-xs text-white/80">Reject</button>
                </motion.article>
              )) : <div className="rounded-2xl border border-white/[0.06] bg-[#111] p-10 text-center text-white/65">No requests.</div>}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedUser ? (
          <>
            <motion.button key="backdrop" className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} aria-label="Close profile modal" />
            <motion.div key="modal" initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }} transition={transition} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/[0.06] bg-[#111] p-6">
              <button className="absolute right-3 top-3 rounded-full border border-white/10 px-2 py-1 text-xs text-white/60" onClick={() => setSelectedUser(null)}>✕</button>
              <div className="flex flex-col items-center text-center">
                <Avatar user={selectedUser} size="h-20 w-20" />
                <p className="mt-3 text-lg text-white">@{selectedUser.username}</p>
                <p className="mt-1 max-w-[280px] text-sm text-white/65">{selectedUser.bio?.slice(0, 120) || "No bio yet."}</p>
                {selectedUser.verified ? <span className="mt-2 rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/75">Verified</span> : null}
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {selectedUser.relationship === "pending" ? <button disabled className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60">Pending</button> : null}
                  {selectedUser.relationship === "friends" ? <button onClick={() => void removeFriend(selectedUser.id)} className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white/80">Remove</button> : null}
                  {selectedUser.relationship === "none" || !selectedUser.relationship ? <button onClick={() => void sendRequest(selectedUser.id)} className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white/80">Add Friend</button> : null}
                  {requestMap.get(selectedUser.id) ? (
                    <>
                      <button onClick={() => void actOnRequest(requestMap.get(selectedUser.id)!, "accept")} className="rounded-xl border border-[#FF2E63] px-3 py-2 text-xs text-white">Accept</button>
                      <button onClick={() => void actOnRequest(requestMap.get(selectedUser.id)!, "reject")} className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white/80">Reject</button>
                    </>
                  ) : null}
                  <button onClick={() => setMessage("Messaging is coming soon.")} className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white/80">Message</button>
                  <button onClick={() => void blockUser(selectedUser.id)} className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white/80">Block</button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {message ? (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-[#111] px-4 py-2 text-xs text-white/80" onClick={() => setMessage(null)}>
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";

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

type ChatSearchUser = {
  id: string;
  username: string;
  avatarUrl: string;
  bio: string;
};

type ConversationRow = {
  id: string;
  friendUser: { id: string; username: string; avatarUrl: string };
  lastMessage: { text: string; createdAt: string } | null;
  expiresAt: string;
};

type Tab = "friends" | "requests" | "blocked" | "chats";

function initials(value: string) {
  return (value?.[0] ?? "U").toUpperCase();
}

function Avatar({ user, size = "h-11 w-11" }: { user: Pick<UserCard, "avatarUrl" | "username">; size?: string }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.username} className={`${size} rounded-full object-cover`} />;
  }

  return <div className={`${size} flex items-center justify-center rounded-full bg-white/10 text-sm text-white/80`}>{initials(user.username)}</div>;
}

function MinimalSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-3 border-b border-white/12 pb-3 text-white/70 focus-within:border-white/26 focus-within:text-white">
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
        <circle cx="9" cy="9" r="5.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="m13 13 3.2 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
      />
      {value ? (
        <button type="button" className="text-[11px] uppercase tracking-[0.18em] text-white/40 hover:text-white/70" onClick={() => onChange("")}>
          Clear
        </button>
      ) : null}
    </label>
  );
}

function RowAction({ onClick, children, tone = "default" }: { onClick?: () => void; children: React.ReactNode; tone?: "default" | "accent" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={tone === "accent"
        ? "text-[11px] uppercase tracking-[0.14em] text-[#c27a8c] hover:text-[#dda7b4]"
        : "text-[11px] uppercase tracking-[0.14em] text-white/52 hover:text-white/80"}
    >
      {children}
    </button>
  );
}

export function FriendsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<UserCard[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<UserCard[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserCard[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserCard | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [chatQuery, setChatQuery] = useState("");
  const [chatSearching, setChatSearching] = useState(false);
  const [chatResults, setChatResults] = useState<ChatSearchUser[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);

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

  const loadConversations = async () => {
    const response = await fetch("/api/chats/list", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { conversations: ConversationRow[] };
    setConversations(payload.conversations ?? []);
  };

  useEffect(() => {
    void loadFriends();
    void loadRequests();
    void loadBlocked();
    void loadConversations();
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

  useEffect(() => {
    if (chatQuery.trim().length < 3) {
      setChatResults([]);
      setChatSearching(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setChatSearching(true);
      const response = await fetch(`/api/chats/search?username=${encodeURIComponent(chatQuery.trim())}`, { cache: "no-store" });
      if (!response.ok) {
        setChatResults([]);
        setChatSearching(false);
        return;
      }

      const payload = (await response.json()) as { users: ChatSearchUser[] };
      setChatResults(payload.users ?? []);
      setChatSearching(false);
    }, 220);

    return () => clearTimeout(timeout);
  }, [chatQuery]);

  const requestMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of requests) map.set(item.sender.id, item.id);
    return map;
  }, [requests]);

  const sortedConversations = useMemo(() => [...conversations].sort((a, b) => (b.lastMessage?.createdAt ?? "").localeCompare(a.lastMessage?.createdAt ?? "")), [conversations]);

  const refreshAll = async () => {
    await Promise.all([loadFriends(), loadRequests(), loadBlocked(), loadConversations()]);
  };

  const openConversation = async (otherUserId: string) => {
    const response = await fetch("/api/chats/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId })
    });

    if (!response.ok) {
      setMessage("Unable to open chat.");
      return;
    }

    const payload = (await response.json()) as { conversation: { id: string } };
    router.push(`/chats/${payload.conversation.id}`);
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
    if (user.relationship === "friends") return <RowAction>Friends</RowAction>;
    if (user.relationship === "pending") return <RowAction>Pending</RowAction>;
    if (user.relationship === "blocked") return <RowAction>Blocked</RowAction>;
    return <RowAction tone="accent" onClick={() => void sendRequest(user.id)}>Add</RowAction>;
  };

  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-5 text-white sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-8 flex items-center gap-4 border-b border-white/10 pb-4">
          <HeaderMenuDrawer variant="minimal" />
          <h1 className="min-w-0 flex-1 text-[2rem] font-semibold tracking-[-0.05em]">Friends</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/38">{incomingCount} requests</p>
        </header>

        <nav className="mb-6 flex items-center gap-5 border-b border-white/10 pb-2">
          {(["friends", "requests", "blocked", "chats"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative pb-2 text-[12px] uppercase tracking-[0.16em] ${activeTab === tab ? "text-white" : "text-white/45 hover:text-white/72"}`}
            >
              {tab}
              {activeTab === tab ? <motion.span layoutId="friends-tab" className="absolute inset-x-0 bottom-0 h-px bg-[#a35367]" /> : null}
            </button>
          ))}
        </nav>

        {activeTab === "chats" ? (
          <section className="mb-8">
            <MinimalSearch value={chatQuery} onChange={setChatQuery} placeholder="Search chat username" />
            {chatQuery.trim().length >= 3 ? (
              <div className="mt-4">
                {chatSearching ? <p className="py-4 text-sm text-white/45">Searching users…</p> : null}
                {!chatSearching && chatResults.length === 0 ? <p className="py-4 text-sm text-white/45">No users found.</p> : null}
                {!chatSearching ? chatResults.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 border-b border-white/8 py-3.5">
                    <Avatar user={item} size="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] text-white">{item.username}</p>
                      <p className="truncate text-[13px] text-white/45">{item.bio || "Friend"}</p>
                    </div>
                    <RowAction tone="accent" onClick={() => void openConversation(item.id)}>Message</RowAction>
                  </div>
                )) : null}
              </div>
            ) : null}
          </section>
        ) : (
          <section className="mb-8">
            <MinimalSearch value={search} onChange={setSearch} placeholder="Search username" />
            {searchResults.length > 0 ? (
              <div className="mt-4">
                {searchResults.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelectedUser(item)} className="flex w-full items-center gap-3 border-b border-white/8 py-3.5 text-left">
                    <Avatar user={item} size="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] text-white">{item.username}</p>
                      <p className="truncate text-[13px] text-white/45">@{item.username}</p>
                    </div>
                    <span onClick={(event) => event.stopPropagation()}>{statusButton(item)}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "friends" ? (
            <motion.section key="friends-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-white/35">Friends</p>
              {friends.length ? friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 border-b border-white/8 py-4">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSelectedUser({ ...friend, relationship: "friends" })}>
                    <Avatar user={friend} size="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-white">{friend.username}</p>
                      <p className="truncate text-[13px] text-white/45">{friend.bio || `@${friend.username}`}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <RowAction tone="accent" onClick={() => void openConversation(friend.id)}>Message</RowAction>
                    <RowAction onClick={() => void removeFriend(friend.id)}>Remove</RowAction>
                    <RowAction onClick={() => void blockUser(friend.id)}>Block</RowAction>
                  </div>
                </div>
              )) : <p className="py-8 text-sm text-white/45">No connections yet. Start searching.</p>}
            </motion.section>
          ) : null}

          {activeTab === "blocked" ? (
            <motion.section key="blocked-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-white/35">Blocked</p>
              {blockedUsers.length ? blockedUsers.map((blockedUser) => (
                <div key={blockedUser.id} className="flex items-center gap-3 border-b border-white/8 py-4">
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSelectedUser({ ...blockedUser, relationship: "blocked" })}>
                    <Avatar user={blockedUser} size="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-white">{blockedUser.username}</p>
                      <p className="truncate text-[13px] text-white/45">Blocked account</p>
                    </div>
                  </button>
                  <RowAction onClick={() => void unblockUser(blockedUser.id)}>Unblock</RowAction>
                </div>
              )) : <p className="py-8 text-sm text-white/45">No blocked users.</p>}
            </motion.section>
          ) : null}

          {activeTab === "requests" ? (
            <motion.section key="requests-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-white/35">Requests</p>
              {requests.length ? requests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 border-b border-white/8 py-4">
                  <button type="button" onClick={() => setSelectedUser({ ...request.sender, relationship: "none" })}>
                    <Avatar user={request.sender} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-white">{request.sender.username}</p>
                    <p className="truncate text-[13px] text-white/45">{request.sender.bio || "Wants to connect"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <RowAction tone="accent" onClick={() => void actOnRequest(request.id, "accept")}>Accept</RowAction>
                    <RowAction onClick={() => void actOnRequest(request.id, "reject")}>Reject</RowAction>
                  </div>
                </div>
              )) : <p className="py-8 text-sm text-white/45">No requests.</p>}
            </motion.section>
          ) : null}

          {activeTab === "chats" ? (
            <motion.section key="chats-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-white/35">Recent</p>
              {sortedConversations.length ? sortedConversations.map((chat) => (
                <button key={chat.id} type="button" onClick={() => router.push(`/chats/${chat.id}`)} className="flex w-full items-center gap-3 border-b border-white/8 py-4 text-left">
                  <Avatar user={{ username: chat.friendUser.username, avatarUrl: chat.friendUser.avatarUrl }} size="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-white">{chat.friendUser.username}</p>
                    <p className="truncate text-[13px] text-white/45">{chat.lastMessage?.text || "Start your conversation"}</p>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-white/52">Open</span>
                </button>
              )) : <p className="py-8 text-sm text-white/45">No chats yet.</p>}
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedUser ? (
          <>
            <motion.button key="backdrop" className="fixed inset-0 z-40 bg-black/72" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} aria-label="Close profile modal" />
            <motion.div key="modal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }} className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 border border-white/12 bg-[#0a0a0a] p-6">
              <button className="absolute right-3 top-3 text-xs uppercase tracking-[0.12em] text-white/55" onClick={() => setSelectedUser(null)}>Close</button>
              <div className="flex flex-col items-center text-center">
                <Avatar user={selectedUser} size="h-20 w-20" />
                <p className="mt-3 text-lg text-white">@{selectedUser.username}</p>
                <p className="mt-1 max-w-[300px] text-sm text-white/60">{selectedUser.bio?.slice(0, 120) || "No bio yet."}</p>
                {selectedUser.verified ? <span className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/48">Verified</span> : null}
                <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {selectedUser.relationship === "pending" ? <RowAction>Pending</RowAction> : null}
                  {selectedUser.relationship === "friends" ? (
                    <>
                      <RowAction tone="accent" onClick={() => void openConversation(selectedUser.id)}>Message</RowAction>
                      <RowAction onClick={() => void removeFriend(selectedUser.id)}>Remove</RowAction>
                      <RowAction onClick={() => void blockUser(selectedUser.id)}>Block</RowAction>
                    </>
                  ) : null}
                  {selectedUser.relationship === "blocked" ? <RowAction onClick={() => void unblockUser(selectedUser.id)}>Unblock</RowAction> : null}
                  {selectedUser.relationship === "none" || !selectedUser.relationship ? <RowAction tone="accent" onClick={() => void sendRequest(selectedUser.id)}>Add</RowAction> : null}
                  {requestMap.get(selectedUser.id) ? (
                    <>
                      <RowAction tone="accent" onClick={() => void actOnRequest(requestMap.get(selectedUser.id)!, "accept")}>Accept</RowAction>
                      <RowAction onClick={() => void actOnRequest(requestMap.get(selectedUser.id)!, "reject")}>Reject</RowAction>
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
          <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border border-white/15 bg-[#0f0f0f] px-4 py-2 text-xs text-white/80" onClick={() => setMessage(null)}>
            {message}
          </motion.button>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Friend = {
  id: string;
  username: string;
  avatarUrl: string;
  verified?: boolean;
};

type RoomCreateSheetProps = {
  open: boolean;
  onClose: () => void;
  friends: Friend[];
  mode?: "create" | "invite";
  roomId?: string;
  onCreated?: (roomId: string) => void;
  onInvited?: () => void;
};

export function RoomCreateSheet({ open, onClose, friends, mode = "create", roomId, onCreated, onInvited }: RoomCreateSheetProps) {
  const [roomName, setRoomName] = useState("");
  const [enableTextChat, setEnableTextChat] = useState(true);
  const [roomVibe, setRoomVibe] = useState<"focus" | "chill" | "party">("chill");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createStep, setCreateStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");
    setSelectedIds([]);
    setError(null);

    if (mode === "create") {
      setRoomName("");
      setEnableTextChat(true);
      setRoomVibe("chill");
      setCreateStep(1);
    }
  }, [mode, open]);

  const filteredFriends = useMemo(() => {
    if (!query.trim()) {
      return friends;
    }

    const normalized = query.toLowerCase();
    return friends.filter((friend) => friend.username.toLowerCase().includes(normalized));
  }, [friends, query]);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (mode === "create") {
        const response = await fetch("/api/private-room/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: roomName.trim(),
            enableTextChat,
            invitedUserIds: selectedIds
          })
        });

        if (!response.ok) {
          throw new Error("Unable to create room");
        }

        const data = (await response.json()) as { room?: { id: string } };

        if (!data.room?.id) {
          throw new Error("Invalid room response");
        }

        onCreated?.(data.room.id);
        onClose();
        return;
      }

      if (!roomId) {
        throw new Error("Room ID is missing");
      }

      const response = await fetch(`/api/private-room/${roomId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitedUserIds: selectedIds })
      });

      if (!response.ok) {
        throw new Error("Unable to send invites");
      }

      onInvited?.();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedIds.length;
  const canGoStepTwo = roomName.trim().length > 0;
  const canCreateRoom = roomName.trim().length > 0;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.3, ease: "easeOut" }}>
            <div className="mx-auto h-[88svh] w-full max-w-xl rounded-t-3xl border border-white/10 bg-[#050505]/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{mode === "create" ? "Create Private Room" : "Invite Friends"}</h2>
                <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">Close</button>
              </div>

              {mode === "create" ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-white/55">
                      <span>Step {createStep} of 3</span>
                      <span>{createStep === 1 ? "Room details" : createStep === 2 ? "Room vibe" : "Invite friends"}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className={`h-1.5 rounded-full ${step <= createStep ? "bg-[#ff4b84]" : "bg-white/15"}`} />
                      ))}
                    </div>
                  </div>

                  {createStep === 1 ? (
                    <div className="space-y-3">
                      <label className="block text-[11px] uppercase tracking-[0.12em] text-white/65">Room name</label>
                      <input
                        value={roomName}
                        onChange={(event) => setRoomName(event.target.value)}
                        placeholder="For example: Midnight Talk"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-white/35"
                      />
                      <p className="text-xs text-white/55">Use a short, catchy name to make invites feel special.</p>
                    </div>
                  ) : null}

                  {createStep === 2 ? (
                    <div className="space-y-3">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-white/65">Select room vibe</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "focus", title: "Focus", subtitle: "Clean + minimal" },
                          { key: "chill", title: "Chill", subtitle: "Casual talk" },
                          { key: "party", title: "Party", subtitle: "High energy" }
                        ].map((option) => {
                          const selected = roomVibe === option.key;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => setRoomVibe(option.key as "focus" | "chill" | "party")}
                              className={`rounded-2xl border px-3 py-3 text-left ${selected ? "border-[#ff4b84]/70 bg-[#ff4b84]/12" : "border-white/10 bg-white/[0.03]"}`}
                            >
                              <p className="text-sm font-medium">{option.title}</p>
                              <p className="mt-1 text-[11px] text-white/55">{option.subtitle}</p>
                            </button>
                          );
                        })}
                      </div>
                      <button type="button" onClick={() => setEnableTextChat((current) => !current)} className="mt-1 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                        <span>Enable text chat</span>
                        <span className={enableTextChat ? "text-emerald-300" : "text-white/50"}>{enableTextChat ? "On" : "Off"}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {mode === "invite" || createStep === 3 ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-white/65">{mode === "create" ? "Step 3: Invite friends" : "Select friends"}</p>
                    <p className="text-xs text-white/55">{selectedCount} selected</p>
                  </div>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search friends" className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-white/35" />
                  <div className="max-h-[46svh] space-y-2 overflow-y-auto pr-1">
                    {filteredFriends.map((friend) => {
                      const selected = selectedIds.includes(friend.id);
                      return (
                        <button key={friend.id} type="button" onClick={() => setSelectedIds((current) => (current.includes(friend.id) ? current.filter((id) => id !== friend.id) : [...current, friend.id]))} className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 ${selected ? "border-[#FF2E63]/70 bg-[#FF2E63]/10" : "border-white/10 bg-white/[0.03]"}`}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-xs font-medium">
                              {friend.avatarUrl ? <img src={friend.avatarUrl} alt={friend.username} className="h-full w-full object-cover" /> : friend.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <p className="text-sm">@{friend.username}</p>
                              {friend.verified ? <p className="text-[11px] text-sky-300">Verified</p> : null}
                            </div>
                          </div>
                          <span className={`h-5 w-5 rounded-md border ${selected ? "border-[#FF2E63] bg-[#FF2E63]" : "border-white/30"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

              {mode === "create" ? (
                <div className="mt-4 flex items-center gap-2">
                  {createStep > 1 ? (
                    <button type="button" onClick={() => setCreateStep((current) => current - 1)} className="inline-flex shrink-0 rounded-full border border-white/15 px-4 py-2.5 text-xs text-white/85">
                      Back
                    </button>
                  ) : null}

                  {createStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCreateStep((current) => current + 1)}
                      disabled={createStep === 1 && !canGoStepTwo}
                      className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-white to-[#ffe3eb] px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void submit()}
                      disabled={loading || !canCreateRoom}
                      className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-white to-[#ffe3eb] px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
                    >
                      {loading ? "Please wait..." : `Create ${roomVibe[0].toUpperCase()}${roomVibe.slice(1)} Room`}
                    </button>
                  )}
                </div>
              ) : (
                <button type="button" onClick={() => void submit()} disabled={loading} className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-white to-[#ffe3eb] px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">
                  {loading ? "Please wait..." : "Send Invites"}
                </button>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

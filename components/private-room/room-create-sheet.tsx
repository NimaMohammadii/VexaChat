"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

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

type RoomVibe = "chill" | "focus" | "late-night" | "party";
type RoomVisibility = "private" | "public";

const vibes: Array<{ id: RoomVibe; label: string; detail: string; accent: string }> = [
  { id: "chill", label: "Chill", detail: "Relaxed and easy conversation", accent: "from-sky-300/70 to-indigo-300/60" },
  { id: "focus", label: "Focus", detail: "Quiet and intentional speaking", accent: "from-emerald-300/70 to-cyan-300/60" },
  { id: "late-night", label: "Late Night", detail: "Slow pace with cozy energy", accent: "from-fuchsia-300/70 to-rose-300/60" },
  { id: "party", label: "Party", detail: "High-energy quick interactions", accent: "from-amber-300/70 to-pink-300/60" }
];

const visibilities: Array<{ id: RoomVisibility; title: string; detail: string; note: string }> = [
  { id: "private", title: "Private room", detail: "Only invited people can join.", note: "Invite-only" },
  { id: "public", title: "Public room", detail: "Appears in Private Room discovery.", note: "Visible to everyone" }
];

function DecorativeBlob() {
  return (
    <svg aria-hidden viewBox="0 0 400 260" className="pointer-events-none absolute right-0 top-0 h-52 w-64 text-[#f4b9ca]/25">
      <defs>
        <linearGradient id="roomCreateBlob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#a7d7ff" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path
        fill="url(#roomCreateBlob)"
        d="M61.6,-58.9C85.1,-53.1,113.4,-39.2,123.3,-16.8C133.2,5.7,124.7,36.7,106.2,57.7C87.8,78.8,59.5,89.9,32.4,101.3C5.2,112.7,-20.9,124.4,-45.3,117.8C-69.8,111.2,-92.4,86.3,-102,59.4C-111.6,32.4,-108.2,3.5,-101.5,-24.3C-94.8,-52.1,-84.8,-78.8,-66.2,-87.6C-47.7,-96.5,-20.6,-87.4,0.6,-88.2C21.8,-88.9,43.6,-99.5,61.6,-58.9Z"
        transform="translate(200 120)"
      />
    </svg>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step} of 3`}>
      {[1, 2, 3].map((dot) => (
        <span key={dot} className={`h-1.5 rounded-full transition-all ${dot === step ? "w-7 bg-white" : dot < step ? "w-4 bg-[#f5adc2]" : "w-4 bg-white/20"}`} />
      ))}
    </div>
  );
}

export function RoomCreateSheet({ open, onClose, friends, mode = "create", roomId, onCreated, onInvited }: RoomCreateSheetProps) {
  const [step, setStep] = useState(1);
  const [roomName, setRoomName] = useState("");
  const [enableTextChat, setEnableTextChat] = useState(true);
  const [roomVibe, setRoomVibe] = useState<RoomVibe>("chill");
  const [roomVisibility, setRoomVisibility] = useState<RoomVisibility>("private");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setStep(mode === "create" ? 1 : 2);
    setQuery("");
    setSelectedIds([]);
    setError(null);

    if (mode === "create") {
      setRoomName("");
      setEnableTextChat(true);
      setRoomVibe("chill");
      setRoomVisibility("private");
    }
  }, [mode, open]);

  const filteredFriends = useMemo(() => {
    if (!query.trim()) return friends;
    const normalized = query.toLowerCase();
    return friends.filter((friend) => friend.username.toLowerCase().includes(normalized));
  }, [friends, query]);

  const selectedPeople = useMemo(() => friends.filter((friend) => selectedIds.includes(friend.id)), [friends, selectedIds]);

  const submit = async () => {
    if (mode === "create" && step < 3) {
      setStep((current) => Math.min(3, current + 1));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "create") {
        const response = await fetch("/api/private-room/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: roomName.trim(),
            vibe: roomVibe,
            visibility: roomVisibility,
            enableTextChat,
            invitedUserIds: selectedIds
          })
        });

        if (!response.ok) throw new Error("Unable to create room");

        const data = (await response.json()) as { room?: { id: string } };
        if (!data.room?.id) throw new Error("Invalid room response");

        onCreated?.(data.room.id);
        onClose();
        return;
      }

      if (!roomId) throw new Error("Room ID is missing");

      const response = await fetch(`/api/private-room/${roomId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitedUserIds: selectedIds })
      });

      if (!response.ok) throw new Error("Unable to send invites");

      onInvited?.();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = step === 1 ? roomName.trim().length >= 2 : true;
  const canSubmit = mode === "create" ? (step === 3 ? !loading : canGoNext) : !loading;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <div className="relative mx-auto h-[90svh] w-full max-w-xl overflow-hidden rounded-t-[34px] border border-white/10 bg-[#07080b]/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5">
              <DecorativeBlob />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">{mode === "create" ? "Create private room" : "Invite people"}</p>
                  <h2 className="mt-1 text-lg font-semibold">{mode === "create" ? "Design your room" : "Invite your friends"}</h2>
                </div>
                <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80" aria-label="Close private room flow">
                  Close
                </button>
              </div>

              {mode === "create" ? (
                <div className="relative z-10 mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <p className="text-xs text-white/70">Step {step} of 3</p>
                  <StepDots step={step} />
                </div>
              ) : null}

              <AnimatePresence mode="wait">
                {step === 1 && mode === "create" ? (
                  <motion.section key="step-1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="relative z-10 mt-4 space-y-3">
                    <label className="block text-xs uppercase tracking-[0.12em] text-white/60">Room basics</label>
                    <input
                      value={roomName}
                      onChange={(event) => setRoomName(event.target.value)}
                      placeholder="Name your room"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-white/35"
                      aria-label="Room name"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {vibes.map((vibe) => (
                        <button
                          key={vibe.id}
                          type="button"
                          onClick={() => setRoomVibe(vibe.id)}
                          className={`rounded-2xl border p-3 text-left transition ${roomVibe === vibe.id ? "border-white/50 bg-white/[0.08]" : "border-white/10 bg-white/[0.03]"}`}
                          aria-pressed={roomVibe === vibe.id}
                        >
                          <span className={`mb-2 block h-1.5 w-14 rounded-full bg-gradient-to-r ${vibe.accent}`} />
                          <p className="text-sm font-medium">{vibe.label}</p>
                          <p className="mt-1 text-xs text-white/55">{vibe.detail}</p>
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setEnableTextChat((current) => !current)} className={`rounded-2xl border px-3 py-3 text-left text-sm ${enableTextChat ? "border-[#a9d6ff]/40 bg-[#a9d6ff]/10" : "border-white/10 bg-white/[0.03]"}`}>
                      <p className="font-medium">Text chat</p>
                      <p className="mt-1 text-xs text-white/60">{enableTextChat ? "Enabled" : "Disabled"}</p>
                    </button>
                  </motion.section>
                ) : null}

                {step === 2 ? (
                  <motion.section key="step-2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="relative z-10 mt-4 space-y-3">
                    <label className="block text-xs uppercase tracking-[0.12em] text-white/60">People</label>
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search friends"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none focus:border-white/35"
                      aria-label="Search friends"
                    />
                    {selectedPeople.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedPeople.map((friend) => (
                          <button key={friend.id} type="button" onClick={() => setSelectedIds((current) => current.filter((id) => id !== friend.id))} className="rounded-full border border-white/20 bg-white/[0.06] px-2.5 py-1 text-xs text-white/90">
                            @{friend.username} ✕
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/55">No one selected yet. Invite people you trust.</p>
                    )}

                    <div className="max-h-[42svh] space-y-2 overflow-y-auto pr-1">
                      {filteredFriends.map((friend) => {
                        const selected = selectedIds.includes(friend.id);
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => setSelectedIds((current) => (current.includes(friend.id) ? current.filter((id) => id !== friend.id) : [...current, friend.id]))}
                            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 ${selected ? "border-[#FF2E63]/70 bg-[#FF2E63]/10" : "border-white/10 bg-white/[0.03]"}`}
                            aria-pressed={selected}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-xs font-medium">
                                {friend.avatarUrl ? <img src={friend.avatarUrl} alt={friend.username} className="h-full w-full object-cover" /> : friend.username.slice(0, 2).toUpperCase()}
                              </div>
                              <p className="text-sm">@{friend.username}</p>
                            </div>
                            <span className={`h-5 w-5 rounded-md border ${selected ? "border-[#FF2E63] bg-[#FF2E63]" : "border-white/30"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </motion.section>
                ) : null}

                {step === 3 && mode === "create" ? (
                  <motion.section key="step-3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="relative z-10 mt-4 space-y-3">
                    <label className="block text-xs uppercase tracking-[0.12em] text-white/60">Privacy & review</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {visibilities.map((visibility) => (
                        <button
                          key={visibility.id}
                          type="button"
                          onClick={() => setRoomVisibility(visibility.id)}
                          className={`rounded-2xl border p-3 text-left transition ${roomVisibility === visibility.id ? "border-white/55 bg-white/[0.08]" : "border-white/10 bg-white/[0.03]"}`}
                          aria-pressed={roomVisibility === visibility.id}
                        >
                          <p className="text-sm font-semibold">{visibility.title}</p>
                          <p className="mt-1 text-xs text-white/60">{visibility.detail}</p>
                          <span className="mt-2 inline-flex rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/70">{visibility.note}</span>
                        </button>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-medium text-white/95">{roomName.trim()}</p>
                      <p className="mt-1 text-xs text-white/60">Mood: {vibes.find((v) => v.id === roomVibe)?.label}</p>
                      <p className="mt-1 text-xs text-white/60">Visibility: {roomVisibility === "public" ? "Public" : "Private"}</p>
                      <p className="mt-1 text-xs text-white/60">Text chat: {enableTextChat ? "On" : "Off"}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.12em] text-white/45">Invited users</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-white/85">
                        {selectedPeople.length > 0 ? selectedPeople.map((friend) => <li key={friend.id}>@{friend.username}</li>) : <li className="text-white/55">No invites selected</li>}
                      </ul>
                    </div>
                  </motion.section>
                ) : null}
              </AnimatePresence>

              {error ? <p className="relative z-10 mt-3 text-sm text-rose-300">{error}</p> : null}

              <div className="relative z-10 mt-4 flex items-center gap-2">
                {mode === "create" && step > 1 ? (
                  <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/90">
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={!canSubmit}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-white to-[#ffe3eb] px-5 py-3 text-sm font-semibold text-black transition active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? "Please wait..." : mode === "create" ? (step === 3 ? "Create Room" : "Continue") : "Send Invites"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

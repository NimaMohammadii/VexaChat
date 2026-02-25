"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PrivateRoomFriend } from "@/lib/mock/private-room-friends";

type RoomCreateSheetProps = {
  open: boolean;
  onClose: () => void;
  friends: PrivateRoomFriend[];
};

type Step = 1 | 2 | 3;

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="M12 3.2 13.9 8l4.8 1.9-4.8 1.9L12 16.6l-1.9-4.8L5.3 9.9 10.1 8 12 3.2Z" fill="currentColor" />
    </svg>
  );
}

export function RoomCreateSheet({ open, onClose, friends }: RoomCreateSheetProps) {
  const [step, setStep] = useState<Step>(1);
  const [roomName, setRoomName] = useState("");
  const [enableTextChat, setEnableTextChat] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setStep(1);
    setRoomName("");
    setEnableTextChat(true);
    setQuery("");
    setSelectedIds([]);
    setRoomCode(`PRIV-${Math.random().toString(36).slice(2, 6).toUpperCase()}`);
    setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const filteredFriends = useMemo(() => {
    if (!query.trim()) {
      return friends;
    }

    const normalized = query.toLowerCase();
    return friends.filter((friend) => friend.name.toLowerCase().includes(normalized) || friend.handle.toLowerCase().includes(normalized));
  }, [friends, query]);

  const selectedFriends = useMemo(
    () => friends.filter((friend) => selectedIds.includes(friend.id)).map((friend, index) => ({ ...friend, status: index === 0 ? "Joined" : "Invited" as const })),
    [friends, selectedIds]
  );

  const toggleFriend = (friendId: string) => {
    setSelectedIds((current) => (current.includes(friendId) ? current.filter((id) => id !== friendId) : [...current, friendId]));
  };

  const copyInviteLink = async () => {
    const link = `https://vexachat.app/private-room/${roomCode}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Create private room"
            className="fixed inset-0 z-50 h-[100svh] overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="mx-auto flex h-full w-full max-w-xl flex-col border border-white/10 bg-[#050505]/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Private Room Setup</p>
                <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 transition hover:border-white/40 hover:text-white active:scale-95">
                  Close
                </button>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((value) => (
                  <div key={value} className={`h-1 rounded-full ${value <= step ? "bg-[#FF2E63]" : "bg-white/10"}`} />
                ))}
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                {step === 1 ? (
                  <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Room Setup</h2>
                    <p className="text-sm text-white/65">Configure your invite-only space. You can update details later.</p>
                    <label className="block space-y-2">
                      <span className="text-sm text-white/80">Room name <span className="text-white/40">(optional)</span></span>
                      <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Late Night Circle" className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition focus:border-white/30" />
                    </label>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/50">Room type</p>
                      <p className="mt-2 text-sm">Invite-only</p>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <button type="button" className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
                        <span>Audio</span><span className="text-emerald-300">On</span>
                      </button>
                      <button type="button" className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm text-white/65">
                        <span>Video</span><span>Coming soon</span>
                      </button>
                      <button type="button" onClick={() => setEnableTextChat((state) => !state)} className="flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm transition hover:border-white/30">
                        <span>Text chat</span><span className={enableTextChat ? "text-emerald-300" : "text-white/55"}>{enableTextChat ? "On" : "Off"}</span>
                      </button>
                    </div>
                  </section>
                ) : null}

                {step === 2 ? (
                  <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Invite Friends</h2>
                    <p className="text-sm text-white/65">Pick who joins your room first. This list is local for now.</p>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or handle" className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition focus:border-white/30" />
                    <div className="space-y-2">
                      {filteredFriends.map((friend) => {
                        const selected = selectedIds.includes(friend.id);

                        return (
                          <button key={friend.id} type="button" onClick={() => toggleFriend(friend.id)} className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition active:scale-[0.99] ${selected ? "border-[#FF2E63]/70 bg-[#FF2E63]/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-medium">{friend.avatar}</div>
                              <div>
                                <p className="text-sm font-medium">{friend.name}</p>
                                <p className="text-xs text-white/55">{friend.handle}</p>
                              </div>
                            </div>
                            <span className={`h-5 w-5 rounded-md border ${selected ? "border-[#FF2E63] bg-[#FF2E63]" : "border-white/25"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {step === 3 ? (
                  <section className="space-y-4">
                    <h2 className="text-2xl font-semibold">Lobby</h2>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-white/55">Room</p>
                      <p className="mt-1 text-lg">{roomName.trim() || "Private Space"}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/50">Code</p>
                      <p className="mt-1 text-base text-[#FF8AA7]">{roomCode || "PRIV-AB12"}</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium">Members</p>
                      <div className="mt-3 space-y-2">
                        {(selectedFriends.length ? selectedFriends : friends.slice(0, 2).map((friend, index) => ({ ...friend, status: index === 0 ? "Joined" : "Invited" as const }))).map((friend) => (
                          <div key={friend.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
                            <div>
                              <p className="text-sm">{friend.name}</p>
                              <p className="text-xs text-white/55">{friend.handle}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${friend.status === "Joined" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/65"}`}>{friend.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>

              <div className="mt-4 space-y-2">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={() => setStep((current) => (Math.min(3, current + 1) as Step))}
                    disabled={step === 2 && selectedIds.length === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-white to-[#ffe3eb] px-5 py-3 text-sm font-semibold text-black transition duration-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <SparkIcon />
                    {step === 1 ? "Next" : "Create & Invite"}
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={copyInviteLink} className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-medium transition hover:border-white/35">
                      {copied ? "Copied" : "Copy Invite Link"}
                    </button>
                    <button type="button" disabled className="inline-flex w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white/45">
                      Start Talking • Coming soon
                    </button>
                  </>
                )}

                {step > 1 ? (
                  <button type="button" onClick={() => setStep((current) => (Math.max(1, current - 1) as Step))} className="inline-flex w-full items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/75 transition hover:border-white/30 hover:text-white">
                    Back
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

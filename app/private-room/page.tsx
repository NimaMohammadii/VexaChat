"use client";

import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";
import { LiveRoomGrid } from "@/components/private-room/live-room-grid";
import { LiveRoomHeader } from "@/components/private-room/live-room-header";
import { RoomControls } from "@/components/private-room/room-controls";
import { RoomCreateSheet } from "@/components/private-room/room-create-sheet";
import { RoomBackdropShape } from "@/components/private-room/room-icons";
import { VexaVoicePanel } from "@/components/private-room/vexa-voice-panel";

type LocalAudioTrack = {
  close: () => void;
  setEnabled: (enabled: boolean) => Promise<void>;
};

type Friend = {
  id: string;
  username: string;
  avatarUrl: string;
};

type Invite = {
  id: string;
  roomId: string;
  roomName: string | null;
  roomCode: string;
  ownerUsername: string;
  createdAt?: string;
};

type DeclineUpdate = {
  inviteId: string;
  invitedUsername: string;
  roomName: string | null;
  updatedAt: string;
};

type Participant = {
  id: string;
  userId: string;
  role: "owner" | "participant";
  username: string;
  avatarUrl: string;
};

type RoomDetails = {
  id: string;
  roomCode: string;
  channelName: string;
  name: string | null;
  participants: Participant[];
};

function stableUidFromUserId(userId: string) {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash << 5) - hash + userId.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) % 1_000_000_000;
}

async function loadAgora() {
  if (typeof window === "undefined") return null;
  const mod = await import("agora-rtc-sdk-ng");
  return mod.default;
}

export default function PrivateRoomPage() {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [vexaOpen, setVexaOpen] = useState(false);
  const [vexaState, setVexaState] = useState<"idle" | "connecting" | "listening" | "thinking" | "speaking" | "error">("idle");
  const [joinedAudio, setJoinedAudio] = useState(false);
  const [joiningAudio, setJoiningAudio] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [speakingUids, setSpeakingUids] = useState<number[]>([]);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [inviteCardError, setInviteCardError] = useState<string | null>(null);
  const [declineToast, setDeclineToast] = useState<DeclineUpdate | null>(null);
  const [peek, setPeek] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(780);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const declineSinceRef = useRef<string>(new Date(Date.now() - 2 * 60 * 1000).toISOString());
  const seenDeclinesRef = useRef<Set<string>>(new Set());

  const closeLocalTracks = useCallback(() => {
    localAudioTrackRef.current?.close();
    localAudioTrackRef.current = null;
  }, []);

  const leaveAgora = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    closeLocalTracks();
    setJoinedAudio(false);
    setMicMuted(false);
    setSpeakingUids([]);
  }, [closeLocalTracks]);

  const ensureClient = useCallback(async () => {
    const AgoraRTC = await loadAgora();
    if (!AgoraRTC) throw new Error("Agora SDK unavailable");

    if (clientRef.current) {
      return { AgoraRTC, client: clientRef.current };
    }

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
    });

    client.on("volume-indicator", (volumes) => {
      const active = volumes.filter((item) => item.level > 6).map((item) => Number(item.uid));
      setSpeakingUids(active.filter((uid) => Number.isFinite(uid)));
    });

    client.enableAudioVolumeIndicator();
    clientRef.current = client;

    return { AgoraRTC, client };
  }, []);

  const fetchRoomDetails = useCallback(async (roomId: string) => {
    const response = await fetch(`/api/private-room/${roomId}`);
    if (!response.ok) throw new Error("Unable to load room details");
    const data = (await response.json()) as { room?: RoomDetails };
    if (!data.room) throw new Error("Invalid room details response");
    setRoom(data.room);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [friendsResponse, invitesResponse, activeRoomResponse, meResponse] = await Promise.all([
        fetch("/api/friends/list"),
        fetch("/api/private-room/invites"),
        fetch("/api/private-room/active"),
        fetch("/api/me")
      ]);

      if (!friendsResponse.ok || !invitesResponse.ok || !activeRoomResponse.ok || !meResponse.ok) {
        throw new Error("Unable to load private room data");
      }

      const friendsData = (await friendsResponse.json()) as { friends: Friend[] };
      const invitesData = (await invitesResponse.json()) as { invites: Invite[] };
      const activeRoomData = (await activeRoomResponse.json()) as { room: { id: string } | null };
      const meData = (await meResponse.json()) as { user?: { id?: string } };

      setFriends(friendsData.friends ?? []);
      setInvites(invitesData.invites ?? []);
      setLocalUserId(meData.user?.id ?? null);

      if (activeRoomData.room?.id) {
        setCurrentRoomId(activeRoomData.room.id);
        await fetchRoomDetails(activeRoomData.room.id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchRoomDetails]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const updateViewport = () => setViewportHeight(window.innerHeight);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => void loadDashboard(), 6500);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  useEffect(() => {
    if (!currentRoomId) return;
    const interval = setInterval(() => void fetchRoomDetails(currentRoomId), 5000);
    return () => clearInterval(interval);
  }, [currentRoomId, fetchRoomDetails]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/private-room/invites/sent/updates?since=${encodeURIComponent(declineSinceRef.current)}`);
        if (!response.ok) return;

        const data = (await response.json()) as { updates?: DeclineUpdate[] };
        const updates = data.updates ?? [];

        if (updates.length > 0) {
          const latestUpdate = updates[updates.length - 1];
          declineSinceRef.current = latestUpdate.updatedAt;

          const fresh = updates.find((item) => !seenDeclinesRef.current.has(item.inviteId));
          if (fresh) {
            seenDeclinesRef.current.add(fresh.inviteId);
            setDeclineToast(fresh);
            window.setTimeout(() => setDeclineToast(null), 2800);
          }
        }
      } catch {
        // Best effort polling; keep quiet in UI.
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      void leaveAgora();
    };
  }, [leaveAgora]);

  const joinRoom = useCallback(
    async (roomId: string) => {
      const response = await fetch(`/api/private-room/${roomId}/join`, { method: "POST" });
      if (!response.ok) throw new Error("Unable to join room");

      setCurrentRoomId(roomId);
      setPeek(false);
      await fetchRoomDetails(roomId);
      await loadDashboard();
    },
    [fetchRoomDetails, loadDashboard]
  );

  const respondToInvite = useCallback(
    async (invite: Invite, action: "accept" | "reject") => {
      if (inviteActionLoading) return;
      setInviteActionLoading(true);
      setInviteCardError(null);

      try {
        const response = await fetch(`/api/private-room/invites/${invite.id}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action })
        });

        const data = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Unable to respond to invite");
        }

        setInvites((current) => current.filter((entry) => entry.id !== invite.id));

        if (action === "accept") {
          await joinRoom(invite.roomId);
        }
      } catch (inviteError) {
        setInviteCardError(inviteError instanceof Error ? inviteError.message : "Unable to respond right now.");
      } finally {
        setInviteActionLoading(false);
      }
    },
    [inviteActionLoading, joinRoom]
  );

  const joinAudio = useCallback(async () => {
    if (!room || !appId || joiningAudio || joinedAudio || !localUserId) return;

    setJoiningAudio(true);
    setError(null);

    try {
      const { AgoraRTC, client } = await ensureClient();
      const uid = stableUidFromUserId(localUserId);

      const tokenResponse = await fetch(`/api/agora/token?channel=${encodeURIComponent(room.channelName)}&uid=${uid}`);
      if (!tokenResponse.ok) throw new Error("Unable to fetch Agora token");
      const tokenData = (await tokenResponse.json()) as { token?: string };
      if (!tokenData.token) throw new Error("Invalid Agora token response");

      await client.join(appId, room.channelName, tokenData.token, uid);
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      localAudioTrackRef.current = audioTrack;
      await client.publish([audioTrack]);
      setJoinedAudio(true);
    } catch (joinError) {
      await leaveAgora();
      setError(joinError instanceof Error ? joinError.message : "Unable to join audio");
    } finally {
      setJoiningAudio(false);
    }
  }, [appId, ensureClient, joinedAudio, joiningAudio, leaveAgora, localUserId, room]);

  const leaveRoom = useCallback(async () => {
    if (!currentRoomId) return;
    await fetch(`/api/private-room/${currentRoomId}/leave`, { method: "POST" });
    await leaveAgora();
    setCurrentRoomId(null);
    setRoom(null);
    setVexaState("idle");
    setPeek(false);
    await loadDashboard();
  }, [currentRoomId, leaveAgora, loadDashboard]);

  const toggleMic = useCallback(async () => {
    if (!localAudioTrackRef.current) return;
    const nextMuted = !micMuted;
    await localAudioTrackRef.current.setEnabled(!nextMuted);
    setMicMuted(nextMuted);
  }, [micMuted]);

  const speakingParticipantIds = useMemo(() => {
    if (!room) return new Set<string>();
    const activeUids = new Set(speakingUids);

    return new Set(room.participants.filter((participant) => activeUids.has(stableUidFromUserId(participant.userId))).map((participant) => participant.id));
  }, [room, speakingUids]);

  const topInvite = invites[0] ?? null;
  const peekOffset = Math.max(280, Math.round(viewportHeight * 0.58));

  return (
    <main className="relative flex min-h-[100svh] overflow-hidden bg-[#06070a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <RoomBackdropShape />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pb-[calc(0.8rem+env(safe-area-inset-bottom))] pt-[calc(0.8rem+env(safe-area-inset-top))]">
        <header className="flex items-start justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/70">Private audio</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Private Room</h1>
            <p className="mt-1 text-xs text-white/60">Create, host, and collaborate in a premium private space.</p>
          </div>
          <HeaderMenuDrawer />
        </header>

        {loading ? <p className="text-sm text-white/70">Loading private rooms...</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        {!loading && !currentRoomId ? (
          <>
            <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">Start your room</p>
              <h2 className="mt-2 text-lg font-medium">Create a private live room and invite your inner circle.</h2>
              <p className="mt-1 text-xs text-white/55">A guided 3-step setup with room basics, people selection, and final review.</p>
              <button type="button" onClick={() => setSheetOpen(true)} className="mt-4 inline-flex rounded-full bg-gradient-to-r from-white to-[#f6d5df] px-5 py-2.5 text-xs font-semibold text-black transition active:scale-[0.99]">
                Create Space
              </button>
            </motion.article>

            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-white/70">Incoming invites</h3>
              {invites.length === 0 ? <p className="text-sm text-white/55">No pending invites.</p> : null}
              {invites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm font-medium">{invite.roomName || "Private Space"}</p>
                  <p className="mt-1 text-xs text-white/60">@{invite.ownerUsername} invited you</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => void respondToInvite(invite, "accept")} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-black">
                      Accept
                    </button>
                    <button type="button" onClick={() => void respondToInvite(invite, "reject")} className="rounded-full border border-white/20 px-3 py-1.5 text-[11px] text-white/85">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <AnimatePresence>
        {room ? (
          <motion.section
            key={room.id}
            className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[100svh] w-full max-w-xl flex-col rounded-t-[32px] border border-white/10 bg-[#090b11]/95 px-4 pb-[calc(0.8rem+env(safe-area-inset-bottom))] pt-[calc(0.6rem+env(safe-area-inset-top))] shadow-[0_-24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            initial={{ y: "100%" }}
            animate={{ y: peek ? peekOffset : 0 }}
            exit={{ y: "100%" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: peekOffset }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) {
                setPeek(true);
              } else if (info.offset.y < -70 || info.velocity.y < -500) {
                setPeek(false);
              }
            }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
          >
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/25" aria-hidden />
            <div className="relative flex-1 overflow-hidden">
              {!peek ? (
                <motion.div initial={{ opacity: 0.6, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col gap-3 overflow-y-auto pb-2">
                  <LiveRoomHeader
                    title={room.name || "Private Space"}
                    roomCode={room.roomCode}
                    participantCount={room.participants.length}
                    onInvite={() => setInviteSheetOpen(true)}
                  />

                  <LiveRoomGrid
                    participants={room.participants}
                    localUserId={localUserId}
                    speakingParticipantIds={speakingParticipantIds}
                    onOpenVexa={() => setVexaOpen(true)}
                    vexaState={vexaState}
                  />

                  <p className="px-1 text-[11px] text-white/55">{joinedAudio ? `Audio connected${micMuted ? " • mic muted" : " • mic live"}` : "Tap Join Audio to talk live"}</p>

                  <RoomControls
                    joinedAudio={joinedAudio}
                    joiningAudio={joiningAudio}
                    micMuted={micMuted}
                    onJoinAudio={() => void joinAudio()}
                    onToggleMic={() => void toggleMic()}
                    onInvite={() => setInviteSheetOpen(true)}
                    onOpenVexa={() => setVexaOpen(true)}
                    onLeave={() => void leaveRoom()}
                  />
                </motion.div>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => setPeek(false)}
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.03] p-4 text-left"
                  initial={{ opacity: 0.6, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.99 }}
                  aria-label="Expand room"
                >
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">Private room • Peek mode</p>
                  <h3 className="mt-1 text-base font-semibold text-white/95">{room.name || "Private Space"}</h3>
                  <p className="mt-1 text-xs text-white/65">{room.participants.length} in room • Swipe up to expand</p>
                </motion.button>
              )}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {topInvite ? (
          <motion.aside
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            className="fixed left-1/2 top-[calc(8px+env(safe-area-inset-top))] z-[70] w-[calc(100%-1.4rem)] max-w-md -translate-x-1/2 rounded-2xl border border-white/15 bg-[#111116]/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#e8a4b9]">Private room invite</p>
            <p className="mt-1 text-sm text-white/90">@{topInvite.ownerUsername} invited you to join a private room</p>
            <p className="mt-1 text-[11px] text-white/55">{topInvite.roomName || "Private Space"}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={inviteActionLoading}
                onClick={() => void respondToInvite(topInvite, "accept")}
                className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-semibold text-black disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                disabled={inviteActionLoading}
                onClick={() => void respondToInvite(topInvite, "reject")}
                className="rounded-full border border-white/20 px-3.5 py-1.5 text-[11px] text-white/85 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
            {inviteCardError ? <p className="mt-2 text-[11px] text-rose-300">{inviteCardError}</p> : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {declineToast ? (
          <motion.aside
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            className="fixed left-1/2 top-[calc(8px+env(safe-area-inset-top)+86px)] z-[65] w-[calc(100%-2.1rem)] max-w-sm -translate-x-1/2 rounded-xl border border-white/10 bg-black/85 px-3 py-2 text-xs text-white/90 backdrop-blur-lg"
          >
            @{declineToast.invitedUsername} declined your room invite
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <RoomCreateSheet open={sheetOpen} onClose={() => setSheetOpen(false)} friends={friends} onCreated={(roomId) => void joinRoom(roomId)} />
      <RoomCreateSheet
        open={inviteSheetOpen}
        onClose={() => setInviteSheetOpen(false)}
        friends={friends}
        mode="invite"
        roomId={room?.id}
        onInvited={() => {
          if (room?.id) void fetchRoomDetails(room.id);
        }}
      />

      <VexaVoicePanel open={vexaOpen} onClose={() => setVexaOpen(false)} roomId={room?.id ?? null} onStatusChange={setVexaState} />
    </main>
  );
}

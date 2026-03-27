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
};

type Participant = {
  id: string;
  userId: string;
  role: "owner" | "participant";
  username: string;
  avatarUrl: string;
};

type PublicRoom = {
  id: string;
  roomCode: string;
  name: string | null;
  vibe: string | null;
  type: "public";
  participantCount: number;
  participants: Participant[];
};

type RoomDetails = {
  id: string;
  roomCode: string;
  channelName: string;
  name: string | null;
  vibe?: string | null;
  isPublic?: boolean;
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
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [vexaState, setVexaState] = useState<"idle" | "connecting" | "listening" | "thinking" | "speaking" | "error">("idle");
  const [joinedAudio, setJoinedAudio] = useState(false);
  const [joiningAudio, setJoiningAudio] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [speakingUids, setSpeakingUids] = useState<number[]>([]);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [peek, setPeek] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(780);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const dashboardInFlightRef = useRef(false);
  const vexaPanelRef = useRef<HTMLDivElement | null>(null);

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

  const loadDashboard = useCallback(
    async (showLoading = false) => {
      if (dashboardInFlightRef.current) return;
      dashboardInFlightRef.current = true;

      if (showLoading) {
        setLoading(true);
      }

      try {
        const [friendsResponse, invitesResponse, activeRoomResponse, meResponse, publicRoomsResponse] = await Promise.all([
          fetch("/api/friends/list"),
          fetch("/api/private-room/invites"),
          fetch("/api/private-room/active"),
          fetch("/api/me"),
          fetch("/api/private-room/public")
        ]);

        if (!friendsResponse.ok || !invitesResponse.ok || !activeRoomResponse.ok || !meResponse.ok || !publicRoomsResponse.ok) {
          throw new Error("Unable to load private room data");
        }

        const friendsData = (await friendsResponse.json()) as { friends: Friend[] };
        const invitesData = (await invitesResponse.json()) as { invites: Invite[] };
        const activeRoomData = (await activeRoomResponse.json()) as { room: { id: string } | null };
        const meData = (await meResponse.json()) as { user?: { id?: string } };
        const publicRoomsData = (await publicRoomsResponse.json()) as { rooms: PublicRoom[] };

        setFriends(friendsData.friends ?? []);
        setInvites(invitesData.invites ?? []);
        setPublicRooms(publicRoomsData.rooms ?? []);
        setLocalUserId(meData.user?.id ?? null);

        if (activeRoomData.room?.id) {
          setCurrentRoomId(activeRoomData.room.id);
          await fetchRoomDetails(activeRoomData.room.id);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load data");
      } finally {
        dashboardInFlightRef.current = false;
        setLoading(false);
      }
    },
    [fetchRoomDetails]
  );

  useEffect(() => {
    void loadDashboard(true);
  }, [loadDashboard]);

  useEffect(() => {
    const updateViewport = () => setViewportHeight(window.innerHeight);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => void loadDashboard(false), 8000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  useEffect(() => {
    if (!currentRoomId) return;
    const interval = setInterval(() => void fetchRoomDetails(currentRoomId), 5000);
    return () => clearInterval(interval);
  }, [currentRoomId, fetchRoomDetails]);

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
      void loadDashboard(false);
    },
    [fetchRoomDetails, loadDashboard]
  );

  const respondToInvite = useCallback(
    async (invite: Invite, action: "accept" | "reject") => {
      if (inviteActionLoading) return;
      setInviteActionLoading(true);

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
        setError(inviteError instanceof Error ? inviteError.message : "Unable to respond right now.");
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
    void loadDashboard(false);
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

  const peekOffset = Math.max(260, Math.round(viewportHeight * 0.62));

  return (
    <main className="relative flex min-h-[100svh] overflow-hidden bg-[#040507] text-white">
      <div className="pointer-events-none absolute inset-0">
        <RoomBackdropShape />
        <div className="absolute -left-24 top-32 h-56 w-56 rounded-full bg-fuchsia-300/10 blur-3xl" />
        <div className="absolute -right-20 top-14 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-3 px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))] pt-[calc(0.9rem+env(safe-area-inset-top))]">
        <header className="flex items-start justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-white/70">Private audio</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Private Room</h1>
            <p className="mt-1 text-xs text-white/60">Premium rooms for your trusted people, with public discovery when you want it.</p>
          </div>
          <HeaderMenuDrawer />
        </header>

        {loading ? <p className="text-sm text-white/70">Loading private rooms...</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        {!loading && !currentRoomId ? (
          <>
            <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.42)]">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">Start your room</p>
              <h2 className="mt-2 text-lg font-medium">Create a premium private or public live room.</h2>
              <p className="mt-1 text-xs text-white/55">3 steps: Basics, People, Privacy & Review.</p>
              <button type="button" onClick={() => setSheetOpen(true)} className="mt-4 inline-flex rounded-full bg-gradient-to-r from-white to-[#f6d5df] px-5 py-2.5 text-xs font-semibold text-black transition active:scale-[0.99]">
                Create Space
              </button>
            </motion.article>

            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-white/70">Public rooms</h3>
              {publicRooms.length === 0 ? <p className="text-sm text-white/55">No public rooms live yet.</p> : null}
              {publicRooms.map((publicRoom) => (
                <button
                  key={publicRoom.id}
                  type="button"
                  onClick={() => void joinRoom(publicRoom.id)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white/95">{publicRoom.name || "Open Room"}</p>
                    <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-emerald-200">Public</span>
                  </div>
                  <p className="mt-1 text-[11px] text-white/60">#{publicRoom.roomCode} • {publicRoom.participantCount} live</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {publicRoom.participants.slice(0, 4).map((participant) => (
                      <div key={participant.id} className="h-7 w-7 overflow-hidden rounded-full border border-white/20 bg-white/10">
                        {participant.avatarUrl ? <img src={participant.avatarUrl} alt={participant.username} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-[10px]">{participant.username.slice(0, 2).toUpperCase()}</div>}
                      </div>
                    ))}
                    <p className="text-[11px] text-white/55">{publicRoom.vibe ? `${publicRoom.vibe} mood` : "Join now"}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-white/70">Incoming invites</h3>
              {invites.length === 0 ? <p className="text-sm text-white/55">No pending invites.</p> : null}
              {invites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-sm font-medium">{invite.roomName || "Private Space"}</p>
                  <p className="mt-1 text-xs text-white/60">@{invite.ownerUsername} invited you</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => void respondToInvite(invite, "accept")} className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-black" disabled={inviteActionLoading}>
                      Accept
                    </button>
                    <button type="button" onClick={() => void respondToInvite(invite, "reject")} className="rounded-full border border-white/20 px-3 py-1.5 text-[11px] text-white/85" disabled={inviteActionLoading}>
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
            className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[100svh] w-full max-w-xl flex-col rounded-t-[32px] border border-white/10 bg-[#070a10]/95 px-4 pb-[calc(0.8rem+env(safe-area-inset-bottom))] pt-[calc(0.6rem+env(safe-area-inset-top))] shadow-[0_-24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            initial={{ y: "100%" }}
            animate={{ y: peek ? peekOffset : 0 }}
            exit={{ y: "100%" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: peekOffset }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 540) {
                setPeek(true);
              } else if (info.offset.y < -80 || info.velocity.y < -540) {
                setPeek(false);
              }
            }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
          >
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/25" aria-hidden />
            <div className="relative flex-1 overflow-hidden">
              {!peek ? (
                <motion.div initial={{ opacity: 0.6, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col gap-3 overflow-y-auto pb-2">
                  <LiveRoomHeader
                    title={room.name || "Private Space"}
                    roomCode={room.roomCode}
                    participantCount={room.participants.length}
                    vibeLabel={room.vibe || "Chill"}
                    onInvite={() => setInviteSheetOpen(true)}
                  />

                  <LiveRoomGrid
                    participants={room.participants}
                    localUserId={localUserId}
                    speakingParticipantIds={speakingParticipantIds}
                    onOpenVexa={() => vexaPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    vexaState={vexaState}
                  />

                  <div ref={vexaPanelRef}>
                    <VexaVoicePanel open={Boolean(room)} embedded roomId={room.id} onStatusChange={setVexaState} />
                  </div>

                  <p className="px-1 text-[11px] text-white/55">{joinedAudio ? `Audio connected${micMuted ? " • mic muted" : " • mic live"}` : "Tap Join to talk live"}</p>

                  <RoomControls
                    joinedAudio={joinedAudio}
                    joiningAudio={joiningAudio}
                    micMuted={micMuted}
                    onJoinAudio={() => void joinAudio()}
                    onToggleMic={() => void toggleMic()}
                    onInvite={() => setInviteSheetOpen(true)}
                    onOpenVexa={() => vexaPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
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
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">{room.isPublic ? "Public room" : "Private room"} • Peek mode</p>
                  <h3 className="mt-1 text-base font-semibold text-white/95">{room.name || "Private Space"}</h3>
                  <p className="mt-1 text-xs text-white/65">{room.participants.length} in room • Swipe up to expand</p>
                </motion.button>
              )}
            </div>
          </motion.section>
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
    </main>
  );
}

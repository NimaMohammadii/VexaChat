"use client";

import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";
import { LiveRoomGrid } from "@/components/private-room/live-room-grid";
import { LiveRoomHeader } from "@/components/private-room/live-room-header";
import { RoomControls } from "@/components/private-room/room-controls";
import { RoomCreateSheet } from "@/components/private-room/room-create-sheet";
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

    return new Set(
      room.participants
        .filter((participant) => activeUids.has(stableUidFromUserId(participant.userId)))
        .map((participant) => participant.id)
    );
  }, [room, speakingUids]);

  const topInvite = invites[0] ?? null;

  return (
    <main className="relative flex min-h-[100svh] overflow-hidden bg-[#060607] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#6f2138]/20 blur-[110px]" />
        <div className="absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-[#2b2b31]/45 blur-[130px]" />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-[calc(0.9rem+env(safe-area-inset-top))]">
        <header className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/48">Vexa private room</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white/95">Live audio</h1>
          </div>
          <HeaderMenuDrawer />
        </header>

        {loading ? <p className="text-sm text-white/62">Loading room…</p> : null}
        {error ? <p className="mb-2 text-sm text-rose-300">{error}</p> : null}

        {!loading && !currentRoomId ? (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col justify-center">
            <div className="mx-auto w-full max-w-sm text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-white/95">Start a private voice room</h2>
              <p className="mt-2 text-sm text-white/55">Invite your circle and talk instantly in a live space.</p>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="mt-6 inline-flex rounded-full border border-white/20 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-black"
              >
                Create room
              </button>
            </div>

            <div className="mx-auto mt-8 w-full max-w-md space-y-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Incoming invites</p>
              {invites.length === 0 ? <p className="text-sm text-white/48">No pending invites.</p> : null}
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between border-b border-white/10 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-white/90">{invite.roomName || "Private space"}</p>
                    <p className="text-xs text-white/55">@{invite.ownerUsername} invited you</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void respondToInvite(invite, "accept")}
                      className="rounded-full border border-white/20 bg-white px-3 py-1.5 text-[11px] font-semibold text-black"
                    >
                      Join
                    </button>
                    <button
                      type="button"
                      onClick={() => void respondToInvite(invite, "reject")}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-white/78"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        ) : null}

        {room ? (
          <div className="flex flex-1 flex-col">
            <LiveRoomHeader
              title={room.name || "Private Space"}
              roomCode={room.roomCode}
              participantCount={room.participants.length}
              onInvite={() => setInviteSheetOpen(true)}
              onLeave={() => void leaveRoom()}
            />

            <LiveRoomGrid
              participants={room.participants}
              localUserId={localUserId}
              speakingParticipantIds={speakingParticipantIds}
              onOpenVexa={() => setVexaOpen(true)}
              vexaState={vexaState}
            />

            <p className="mb-2 text-center text-[11px] text-white/52">
              {joinedAudio ? `Audio connected${micMuted ? " · mic muted" : " · mic live"}` : "Join audio to speak in this room"}
            </p>

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
          </div>
        ) : null}
      </section>

      <AnimatePresence>
        {topInvite ? (
          <motion.aside
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            className="fixed left-1/2 top-[calc(8px+env(safe-area-inset-top))] z-[70] w-[calc(100%-1.4rem)] max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-[#111116]/92 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#e8a4b9]">Invite request</p>
            <p className="mt-1 text-sm text-white/90">@{topInvite.ownerUsername} invited you</p>
            <p className="mt-1 text-[11px] text-white/55">{topInvite.roomName || "Private space"}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={inviteActionLoading}
                onClick={() => void respondToInvite(topInvite, "accept")}
                className="rounded-full border border-white/20 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-black disabled:opacity-50"
              >
                Join
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

      <VexaVoicePanel
        open={vexaOpen}
        onClose={() => setVexaOpen(false)}
        roomId={room?.id ?? null}
        onStatusChange={setVexaState}
      />
    </main>
  );
}

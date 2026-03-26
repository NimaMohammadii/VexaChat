"use client";

import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";
import { LiveRoomGrid } from "@/components/private-room/live-room-grid";
import { LiveRoomHeader } from "@/components/private-room/live-room-header";
import { RoomControls } from "@/components/private-room/room-controls";
import { RoomCreateSheet } from "@/components/private-room/room-create-sheet";
import { VexaPanel } from "@/components/private-room/vexa-panel";

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
  const [joinedAudio, setJoinedAudio] = useState(false);
  const [joiningAudio, setJoiningAudio] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [speakingUids, setSpeakingUids] = useState<number[]>([]);
  const [vexaResponse, setVexaResponse] = useState("");
  const [vexaLoading, setVexaLoading] = useState(false);
  const [vexaError, setVexaError] = useState<string | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);

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
      await fetchRoomDetails(roomId);
      await loadDashboard();
    },
    [fetchRoomDetails, loadDashboard]
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
    setVexaError(null);
    setVexaResponse("");
    await loadDashboard();
  }, [currentRoomId, leaveAgora, loadDashboard]);

  const toggleMic = useCallback(async () => {
    if (!localAudioTrackRef.current) return;
    const nextMuted = !micMuted;
    await localAudioTrackRef.current.setEnabled(!nextMuted);
    setMicMuted(nextMuted);
  }, [micMuted]);

  const askVexa = useCallback(
    async (prompt: string) => {
      if (!room) return;
      setVexaLoading(true);
      setVexaError(null);

      try {
        const response = await fetch("/api/private-room/vexa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: room.id, prompt })
        });

        const data = (await response.json().catch(() => ({}))) as { response?: string; error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Unable to ask Vexa right now");
        }

        setVexaResponse(data.response ?? "");
      } catch (vexaRequestError) {
        setVexaError(vexaRequestError instanceof Error ? vexaRequestError.message : "Vexa is temporarily unavailable.");
      } finally {
        setVexaLoading(false);
      }
    },
    [room]
  );

  const speakingParticipantIds = useMemo(() => {
    if (!room) return new Set<string>();
    const activeUids = new Set(speakingUids);

    return new Set(
      room.participants
        .filter((participant) => activeUids.has(stableUidFromUserId(participant.userId)))
        .map((participant) => participant.id)
    );
  }, [room, speakingUids]);

  return (
    <main className="relative flex min-h-[100svh] overflow-hidden bg-[#070708] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-60 w-60 rounded-full bg-[#7d233f]/20 blur-[100px]" />
        <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-white/10 blur-[120px]" />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-4 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        <header className="flex items-start justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">Private audio</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Private Room</h1>
          </div>
          <HeaderMenuDrawer />
        </header>

        {loading ? <p className="text-sm text-white/70">Loading private rooms...</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        {!loading && !currentRoomId ? (
          <>
            <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Start your room</p>
              <h2 className="mt-2 text-xl font-medium">Create a premium private voice room and invite your people.</h2>
              <button type="button" onClick={() => setSheetOpen(true)} className="mt-5 inline-flex rounded-full bg-gradient-to-r from-white to-[#f6d5df] px-6 py-3 text-sm font-semibold text-black">
                Create Space
              </button>
            </motion.article>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/85">Incoming invites</h3>
              {invites.length === 0 ? <p className="text-sm text-white/55">No pending invites.</p> : null}
              {invites.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium">{invite.roomName || "Private Space"}</p>
                  <p className="mt-1 text-xs text-white/60">Code: {invite.roomCode} • Host: @{invite.ownerUsername}</p>
                  <button type="button" onClick={() => void joinRoom(invite.roomId)} className="mt-3 rounded-full border border-white/20 px-4 py-2 text-xs">
                    Join room
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {room ? (
          <>
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
            />

            <p className="text-xs text-white/55">{joinedAudio ? `Audio connected${micMuted ? " • mic muted" : " • mic live"}` : "Not in audio yet"}</p>

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
          </>
        ) : null}
      </section>

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

      <VexaPanel
        open={vexaOpen}
        onClose={() => setVexaOpen(false)}
        loading={vexaLoading}
        response={vexaResponse}
        error={vexaError}
        onSubmit={askVexa}
      />
    </main>
  );
}

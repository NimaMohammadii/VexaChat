"use client";

import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";
import { RoomCreateSheet } from "@/components/private-room/room-create-sheet";

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
};

type RoomDetails = {
  id: string;
  roomCode: string;
  channelName: string;
  name: string | null;
  participants: Participant[];
};

async function loadAgora() {
  if (typeof window === "undefined") {
    return null;
  }

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [joinedAudio, setJoinedAudio] = useState(false);
  const [joiningAudio, setJoiningAudio] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [speakingUids, setSpeakingUids] = useState<number[]>([]);
  const [vexaPrompt, setVexaPrompt] = useState("");
  const [vexaResponse, setVexaResponse] = useState("");
  const [vexaLoading, setVexaLoading] = useState(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const uidRef = useRef<number | null>(null);

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

    if (!AgoraRTC) {
      throw new Error("Agora SDK unavailable");
    }

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

    if (!response.ok) {
      throw new Error("Unable to load room details");
    }

    const data = (await response.json()) as { room?: RoomDetails };

    if (!data.room) {
      throw new Error("Invalid room details response");
    }

    setRoom(data.room);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [friendsResponse, invitesResponse, activeRoomResponse] = await Promise.all([
        fetch("/api/friends/list"),
        fetch("/api/private-room/invites"),
        fetch("/api/private-room/active")
      ]);

      if (!friendsResponse.ok || !invitesResponse.ok || !activeRoomResponse.ok) {
        throw new Error("Unable to load private room data");
      }

      const friendsData = (await friendsResponse.json()) as { friends: Friend[] };
      const invitesData = (await invitesResponse.json()) as { invites: Invite[] };
      const activeRoomData = (await activeRoomResponse.json()) as { room: { id: string } | null };

      setFriends(friendsData.friends ?? []);
      setInvites(invitesData.invites ?? []);

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
    if (!currentRoomId) {
      return;
    }

    const interval = setInterval(() => {
      void fetchRoomDetails(currentRoomId);
    }, 5000);

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
      if (!response.ok) {
        throw new Error("Unable to join room");
      }

      setCurrentRoomId(roomId);
      await fetchRoomDetails(roomId);
      await loadDashboard();
    },
    [fetchRoomDetails, loadDashboard]
  );

  const joinAudio = useCallback(async () => {
    if (!room || !appId || joiningAudio || joinedAudio) {
      return;
    }

    setJoiningAudio(true);

    try {
      const { AgoraRTC, client } = await ensureClient();
      const uid = Math.floor(Math.random() * 1_000_000_000);
      uidRef.current = uid;

      const tokenResponse = await fetch(`/api/agora/token?channel=${encodeURIComponent(room.channelName)}&uid=${uid}`);

      if (!tokenResponse.ok) {
        throw new Error("Unable to fetch Agora token");
      }

      const tokenData = (await tokenResponse.json()) as { token?: string };

      if (!tokenData.token) {
        throw new Error("Invalid Agora token response");
      }

      await client.join(appId, room.channelName, tokenData.token, uid);
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

      localAudioTrackRef.current = audioTrack;
      await client.publish([audioTrack]);
      setJoinedAudio(true);
    } catch (joinError) {
      console.error(joinError);
      await leaveAgora();
      setError(joinError instanceof Error ? joinError.message : "Unable to join audio");
    } finally {
      setJoiningAudio(false);
    }
  }, [appId, ensureClient, joinedAudio, joiningAudio, leaveAgora, room]);

  const leaveRoom = useCallback(async () => {
    if (!currentRoomId) {
      return;
    }

    await fetch(`/api/private-room/${currentRoomId}/leave`, { method: "POST" });
    await leaveAgora();
    setCurrentRoomId(null);
    setRoom(null);
    setVexaResponse("");
    await loadDashboard();
  }, [currentRoomId, leaveAgora, loadDashboard]);

  const toggleMic = useCallback(async () => {
    if (!localAudioTrackRef.current) {
      return;
    }

    const nextMuted = !micMuted;
    await localAudioTrackRef.current.setEnabled(!nextMuted);
    setMicMuted(nextMuted);
  }, [micMuted]);

  const askVexa = useCallback(async () => {
    if (!room || !vexaPrompt.trim()) {
      return;
    }

    setVexaLoading(true);
    setVexaResponse("");

    try {
      const response = await fetch("/api/private-room/vexa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, prompt: vexaPrompt.trim() })
      });

      if (!response.ok) {
        throw new Error("Unable to ask Vexa");
      }

      const data = (await response.json()) as { response?: string };
      setVexaResponse(data.response ?? "");
    } catch (vexaError) {
      setVexaResponse(vexaError instanceof Error ? vexaError.message : "Vexa is unavailable right now.");
    } finally {
      setVexaLoading(false);
    }
  }, [room, vexaPrompt]);

  const speakingSet = useMemo(() => new Set(speakingUids), [speakingUids]);
  const isLocalSpeaking = uidRef.current ? speakingSet.has(uidRef.current) : false;

  return (
    <main className="relative flex min-h-[100svh] overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-14 h-56 w-56 rounded-full bg-[#FF2E63]/15 blur-[90px]" />
        <div className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-white/10 blur-[110px]" />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-xl flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        <header className="flex items-start justify-between">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/70">Secure • Invite-only</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Private Room</h1>
          </div>
          <HeaderMenuDrawer />
        </header>

        {loading ? <p className="mt-8 text-sm text-white/70">Loading private rooms...</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        {!loading && !currentRoomId ? (
          <>
            <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Ready to host</p>
              <h2 className="mt-2 text-xl font-medium">Create a real private audio room and invite friends.</h2>
              <button type="button" onClick={() => setSheetOpen(true)} className="mt-5 inline-flex rounded-full bg-gradient-to-r from-white to-[#ffdce6] px-6 py-3 text-sm font-semibold text-black">
                Create Space
              </button>
            </motion.article>

            <div className="mt-5 space-y-3">
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
          <section className="mt-6 space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-white/50">Live room</p>
              <h2 className="mt-2 text-xl font-semibold">{room.name || "Private Space"}</h2>
              <p className="mt-1 text-sm text-[#ff9fb7]">Code: {room.roomCode}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {!joinedAudio ? (
                  <button type="button" onClick={() => void joinAudio()} disabled={joiningAudio} className="rounded-full bg-gradient-to-r from-white to-[#ffe3eb] px-4 py-2 text-xs font-semibold text-black disabled:opacity-50">
                    {joiningAudio ? "Joining audio..." : "Join audio"}
                  </button>
                ) : (
                  <button type="button" onClick={() => void toggleMic()} className={`rounded-full px-4 py-2 text-xs ${micMuted ? "border border-rose-400/50 text-rose-200" : "border border-emerald-300/40 text-emerald-200"}`}>
                    {micMuted ? "Mic Off" : "Mic On"}
                  </button>
                )}
                <button type="button" onClick={() => setInviteSheetOpen(true)} className="rounded-full border border-white/20 px-4 py-2 text-xs">Invite more</button>
                <button type="button" onClick={() => void leaveRoom()} className="rounded-full border border-white/20 px-4 py-2 text-xs">Leave room</button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium">Participants</p>
              <div className="mt-3 space-y-2">
                {room.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
                    <span>@{participant.username}</span>
                    <span className="text-xs text-white/60">
                      {participant.role === "owner" ? "Host" : "Member"}
                    </span>
                  </div>
                ))}
              </div>
              {joinedAudio ? <p className="mt-2 text-xs text-white/55">You are {isLocalSpeaking ? "speaking" : "connected"}.</p> : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Vexa AI</p>
                <span className="rounded-full border border-[#FF2E63]/35 bg-[#FF2E63]/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#ff8aa7]">Live beta</span>
              </div>
              <p className="mt-2 text-xs text-white/60">Text-response MVP in-room. Voice playback can be added next.</p>
              <textarea value={vexaPrompt} onChange={(event) => setVexaPrompt(event.target.value)} placeholder="Ask Vexa anything..." className="mt-3 h-20 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm outline-none focus:border-white/35" />
              <button type="button" onClick={() => void askVexa()} disabled={vexaLoading || !vexaPrompt.trim()} className="mt-3 rounded-full border border-white/20 px-4 py-2 text-xs disabled:opacity-50">
                {vexaLoading ? "Vexa is thinking..." : "Ask Vexa"}
              </button>
              {vexaResponse ? <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/85">{vexaResponse}</p> : null}
            </div>
          </section>
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
          if (room?.id) {
            void fetchRoomDetails(room.id);
          }
        }}
      />
    </main>
  );
}

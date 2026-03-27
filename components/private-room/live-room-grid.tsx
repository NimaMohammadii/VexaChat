"use client";

import { motion } from "framer-motion";
import { ParticipantBubble } from "@/components/private-room/participant-bubble";
import { AudioWaveIcon, BrainSparkIcon } from "@/components/private-room/room-icons";

type Participant = {
  id: string;
  userId: string;
  role: "owner" | "participant";
  username: string;
  avatarUrl?: string;
};

type VexaVisualState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error";

type LiveRoomGridProps = {
  participants: Participant[];
  localUserId: string | null;
  speakingParticipantIds: Set<string>;
  onOpenVexa: () => void;
  vexaState?: VexaVisualState;
};

export function LiveRoomGrid({ participants, localUserId, speakingParticipantIds, onOpenVexa, vexaState = "idle" }: LiveRoomGridProps) {
  const hosts = participants.filter((participant) => participant.role === "owner");
  const listeners = participants.filter((participant) => participant.role !== "owner");
  const allPeople = [...hosts, ...listeners];

  return (
    <section className="rounded-[28px] border border-white/12 bg-[#0f1016]/75 px-4 py-4 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">Stage</p>
          <p className="mt-0.5 text-xs text-white/70">{allPeople.length} live participants</p>
        </div>
        <motion.button
          type="button"
          onClick={onOpenVexa}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white/80"
          aria-label="Activate Vexa assistant"
        >
          <BrainSparkIcon className="h-3.5 w-3.5" />
          {vexaState === "idle" ? "Vexa ready" : `Vexa ${vexaState}`}
        </motion.button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-x-2.5 gap-y-3 sm:grid-cols-4">
        {allPeople.map((participant) => (
          <ParticipantBubble
            key={participant.id}
            username={participant.username}
            avatarUrl={participant.avatarUrl}
            role={participant.role}
            isLocal={participant.userId === localUserId}
            isSpeaking={speakingParticipantIds.has(participant.id)}
            size="md"
          />
        ))}
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/55">
        <AudioWaveIcon className="h-3.5 w-3.5" />
        {hosts.length} host{hosts.length === 1 ? "" : "s"} • {listeners.length} participant{listeners.length === 1 ? "" : "s"}
      </p>
    </section>
  );
}

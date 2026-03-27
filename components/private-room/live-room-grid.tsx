"use client";

import { ParticipantBubble } from "@/components/private-room/participant-bubble";

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
  const speakers = participants.filter((participant) => participant.role === "owner");
  const listeners = participants.filter((participant) => participant.role !== "owner");
  const allPeople = [...speakers, ...listeners];

  return (
    <section className="flex min-h-[52svh] flex-1 flex-col rounded-[26px] border border-white/10 bg-[#0f0f12]/75 px-4 py-3 pb-5">
    <section className="flex flex-1 flex-col rounded-[26px] border border-white/10 bg-[#0f0f12]/75 px-4 py-3 pb-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/50">In this room</p>
        <button
          type="button"
          onClick={onOpenVexa}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-white/75"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${vexaState === "listening" || vexaState === "speaking" ? "animate-pulse bg-[#d57e96]" : "bg-[#d57e96]"}`} />
          Vexa
        </button>
      </div>

      <div className="mt-3 grid flex-1 content-start grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-5">
        <button type="button" onClick={onOpenVexa} className="flex flex-col items-center gap-1.5 text-center">
          <ParticipantBubble
            username="Vexa"
            subtitle={vexaState === "idle" ? "AI" : vexaState}
            vexa
            isSpeaking={vexaState === "speaking" || vexaState === "listening"}
            size="md"
          />
        </button>

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

      {listeners.length > 0 ? (
        <p className="mt-2 text-[10px] text-white/40">
          {speakers.length} host{speakers.length === 1 ? "" : "s"} • {listeners.length} listener{listeners.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </section>
  );
}

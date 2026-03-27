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

function vexaSubtitle(state: VexaVisualState) {
  if (state === "idle") return "assistant";
  if (state === "connecting") return "joining";
  return state;
}

export function LiveRoomGrid({ participants, localUserId, speakingParticipantIds, onOpenVexa, vexaState = "idle" }: LiveRoomGridProps) {
  const hosts = participants.filter((participant) => participant.role === "owner");
  const listeners = participants.filter((participant) => participant.role !== "owner");

  return (
    <section className="flex flex-1 flex-col justify-center px-1">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-start justify-center gap-5 pb-4">
          {hosts.map((participant) => (
            <ParticipantBubble
              key={participant.id}
              username={participant.username}
              avatarUrl={participant.avatarUrl}
              role={participant.role}
              isLocal={participant.userId === localUserId}
              isSpeaking={speakingParticipantIds.has(participant.id)}
              size="md"
              subtitle="host"
            />
          ))}

          <button type="button" onClick={onOpenVexa} className="mt-[2px] transition active:scale-95">
            <ParticipantBubble
              username="Vexa"
              subtitle={vexaSubtitle(vexaState)}
              vexa
              isSpeaking={vexaState === "speaking" || vexaState === "listening"}
              size="sm"
            />
          </button>
        </div>

        <div className="mx-auto grid max-w-xs grid-cols-4 justify-items-center gap-x-3 gap-y-4 sm:max-w-sm sm:grid-cols-5">
          {listeners.map((participant) => (
            <ParticipantBubble
              key={participant.id}
              username={participant.username}
              avatarUrl={participant.avatarUrl}
              role={participant.role}
              isLocal={participant.userId === localUserId}
              isSpeaking={speakingParticipantIds.has(participant.id)}
              size="xs"
            />
          ))}
        </div>

        <p className="pt-5 text-center text-[10px] uppercase tracking-[0.14em] text-white/40">
          {hosts.length} host · {listeners.length} listener{listeners.length === 1 ? "" : "s"}
        </p>
      </div>
    </section>
  );
}

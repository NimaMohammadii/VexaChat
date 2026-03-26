"use client";

import { ParticipantBubble } from "@/components/private-room/participant-bubble";

type Participant = {
  id: string;
  userId: string;
  role: "owner" | "participant";
  username: string;
  avatarUrl?: string;
};

type LiveRoomGridProps = {
  participants: Participant[];
  localUserId: string | null;
  speakingParticipantIds: Set<string>;
  onOpenVexa: () => void;
};

export function LiveRoomGrid({ participants, localUserId, speakingParticipantIds, onOpenVexa }: LiveRoomGridProps) {
  const speakers = participants.filter((participant) => participant.role === "owner");
  const listeners = participants.filter((participant) => participant.role !== "owner");

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#111114]/70 p-4">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Speakers</p>
          <div className="mt-3 grid grid-cols-3 gap-4 sm:grid-cols-4">
            {speakers.map((participant) => (
              <ParticipantBubble
                key={participant.id}
                username={participant.username}
                avatarUrl={participant.avatarUrl}
                role={participant.role}
                isLocal={participant.userId === localUserId}
                isSpeaking={speakingParticipantIds.has(participant.id)}
                size="lg"
              />
            ))}
            <button type="button" onClick={onOpenVexa} className="flex flex-col items-center gap-2 text-center">
              <ParticipantBubble username="Vexa" subtitle="AI assistant" vexa isSpeaking={false} size="lg" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-white/45">Others in room</p>
          <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {listeners.map((participant) => (
              <ParticipantBubble
                key={participant.id}
                username={participant.username}
                avatarUrl={participant.avatarUrl}
                role={participant.role}
                isLocal={participant.userId === localUserId}
                isSpeaking={speakingParticipantIds.has(participant.id)}
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

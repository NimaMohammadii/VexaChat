"use client";

import { SparklesIcon } from "@/components/private-room/room-icons";

type LiveRoomHeaderProps = {
  title: string;
  roomCode: string;
  participantCount: number;
  vibeLabel?: string;
  onInvite: () => void;
};

export function LiveRoomHeader({ title, roomCode, participantCount, vibeLabel = "Chill", onInvite }: LiveRoomHeaderProps) {
  return (
    <header className="rounded-[24px] border border-white/15 bg-[#101217]/85 px-4 py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Live private room</p>
          <h2 className="mt-1 text-lg font-semibold text-white/95">{title}</h2>
          <p className="mt-1 text-[11px] text-white/60">
            #{roomCode} • {participantCount} inside
          </p>
        </div>
        <button
          type="button"
          onClick={onInvite}
          className="rounded-full border border-white/20 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/90 transition hover:bg-white/[0.09]"
          aria-label="Invite participants"
        >
          Invite
        </button>
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#f5adc2]/25 bg-[#f5adc2]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.13em] text-[#ffdbe6]">
        <SparklesIcon className="h-3.5 w-3.5" />
        {vibeLabel} mood
      </div>
    </header>
  );
}

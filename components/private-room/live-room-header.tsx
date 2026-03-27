"use client";

type LiveRoomHeaderProps = {
  title: string;
  roomCode: string;
  participantCount: number;
  onInvite: () => void;
};

export function LiveRoomHeader({ title, roomCode, participantCount, onInvite }: LiveRoomHeaderProps) {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0e0e10]/70 px-3.5 py-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">Live private room</p>
        <h2 className="mt-0.5 text-base font-semibold text-white/95">{title}</h2>
        <p className="mt-1 text-[11px] text-white/55">
          #{roomCode} • {participantCount} joined
        </p>
      </div>
      <button
        type="button"
        onClick={onInvite}
        className="rounded-full border border-white/20 bg-white/[0.02] px-3 py-1.5 text-[11px] text-white/85"
      >
        Invite
      </button>
    </header>
  );
}

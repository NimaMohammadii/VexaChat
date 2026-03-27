"use client";

type LiveRoomHeaderProps = {
  title: string;
  roomCode: string;
  participantCount: number;
  onInvite: () => void;
  onLeave?: () => void;
};

export function LiveRoomHeader({ title, roomCode, participantCount, onInvite, onLeave }: LiveRoomHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 px-1 pt-1">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Live • private • invite only</p>
        <h2 className="mt-1 truncate text-[1.15rem] font-semibold tracking-tight text-white/95">{title}</h2>
        <p className="mt-1 text-xs text-white/55">
          {participantCount} {participantCount === 1 ? "person" : "people"} · #{roomCode}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onInvite}
          className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.06]"
        >
          Invite
        </button>
        {onLeave ? (
          <button
            type="button"
            onClick={onLeave}
            className="rounded-full border border-[#a54562]/40 bg-[#150d11] px-3 py-1.5 text-[11px] font-medium text-[#f0b3c4] transition hover:border-[#a54562]/60"
          >
            Leave
          </button>
        ) : null}
      </div>
    </header>
  );
}

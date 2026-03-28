"use client";

type LiveRoomHeaderProps = {
  title: string;
  roomCode: string;
  participantCount: number;
  onInvite: () => void;
};

export function LiveRoomHeader({ title, roomCode, participantCount, onInvite }: LiveRoomHeaderProps) {
  return (
    <header className="flex items-center gap-3 rounded-[18px] border border-white/15 border-b-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.065)_0%,rgba(255,255,255,0.022)_45%,rgba(0,0,0,0.06)_100%)] px-3.5 py-3 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.1)] backdrop-blur-[40px]">
      <div className="min-w-0 flex-1">
        <p className="text-[9.5px] uppercase tracking-[0.22em] text-white/35">Live · private audio</p>
        <h2 className="mt-1 truncate text-[20px] font-bold tracking-[-0.03em] text-white">{title}</h2>
        <p className="mt-1 text-[12px] text-white/50">
          #{roomCode} • {participantCount} joined
        </p>
      </div>
      <button
        type="button"
        onClick={onInvite}
        className="h-8 rounded-[10px] border border-white/15 bg-[linear-gradient(160deg,rgba(255,255,255,.1)_0%,rgba(255,255,255,.03)_50%,rgba(0,0,0,.08)_100%)] px-3 text-[12px] font-semibold text-white/85"
      >
        Invite
      </button>
    </header>
  );
}

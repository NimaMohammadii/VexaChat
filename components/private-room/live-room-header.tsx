"use client";

type LiveRoomHeaderProps = {
  title: string;
  roomCode: string;
  participantCount: number;
  onInvite: () => void;
};

export function LiveRoomHeader({ title, roomCode, participantCount, onInvite }: LiveRoomHeaderProps) {
  return (
    <header className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Live now • Invite-only room</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs text-[#d58aa0]">Code: {roomCode}</p>
        </div>
        <button type="button" onClick={onInvite} className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/90">
          Invite
        </button>
      </div>
      <p className="mt-3 text-xs text-white/65">{participantCount} participant{participantCount === 1 ? "" : "s"} in room</p>
    </header>
  );
}

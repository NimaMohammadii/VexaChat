"use client";

type RoomControlsProps = {
  joinedAudio: boolean;
  joiningAudio: boolean;
  micMuted: boolean;
  onJoinAudio: () => void;
  onToggleMic: () => void;
  onInvite: () => void;
  onOpenVexa: () => void;
  onLeave: () => void;
};

function ControlButton({ label, onClick, emphasis, danger }: { label: string; onClick: () => void; emphasis?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-3 text-xs font-medium transition ${danger ? "border border-rose-400/40 text-rose-200" : emphasis ? "bg-white text-black" : "border border-white/20 text-white/90"}`}
    >
      {label}
    </button>
  );
}

export function RoomControls({
  joinedAudio,
  joiningAudio,
  micMuted,
  onJoinAudio,
  onToggleMic,
  onInvite,
  onOpenVexa,
  onLeave
}: RoomControlsProps) {
  return (
    <div className="sticky bottom-0 z-20 rounded-3xl border border-white/10 bg-black/75 p-3 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {!joinedAudio ? (
          <ControlButton label={joiningAudio ? "Joining…" : "Join Audio"} onClick={onJoinAudio} emphasis />
        ) : (
          <ControlButton label={micMuted ? "Mic Off" : "Mic On"} onClick={onToggleMic} />
        )}
        <ControlButton label="Invite" onClick={onInvite} />
        <ControlButton label="Vexa" onClick={onOpenVexa} />
        <ControlButton label="Leave" onClick={onLeave} danger />
      </div>
    </div>
  );
}

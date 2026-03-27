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

function ActionButton({
  label,
  icon,
  onClick,
  danger,
  active
}: {
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-w-[58px] flex-col items-center gap-1.5 rounded-2xl px-2 py-2 transition active:scale-95 ${
        danger
          ? "text-[#f2b7c8]"
          : active
            ? "text-white"
            : "text-white/80"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm ${
          danger
            ? "border-[#9f425f]/50 bg-[#1c0f14]"
            : active
              ? "border-white/35 bg-white/14"
              : "border-white/15 bg-white/[0.04]"
        }`}
      >
        {icon}
      </span>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export function RoomControls({ joinedAudio, joiningAudio, micMuted, onJoinAudio, onToggleMic, onInvite, onOpenVexa, onLeave }: RoomControlsProps) {
  const micLabel = !joinedAudio ? (joiningAudio ? "Joining" : "Join") : micMuted ? "Unmute" : "Mute";
  const micIcon = !joinedAudio ? "🎙" : micMuted ? "🔇" : "🎤";

  return (
    <div className="sticky bottom-[calc(8px+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-md">
      <div className="rounded-[26px] border border-white/10 bg-black/72 px-2 py-2 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <ActionButton label={micLabel} icon={micIcon} onClick={joinedAudio ? onToggleMic : onJoinAudio} active={joinedAudio && !micMuted} />
          <ActionButton label="Invite" icon="＋" onClick={onInvite} />
          <ActionButton label="Vexa" icon="✦" onClick={onOpenVexa} />
          <ActionButton label="Leave" icon="⏻" onClick={onLeave} danger />
        </div>
      </div>
    </div>
  );
}

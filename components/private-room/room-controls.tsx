"use client";

import { motion } from "framer-motion";
import { BrainSparkIcon, ExitIcon, MicIcon, MicOffIcon, UserPlusIcon } from "@/components/private-room/room-icons";

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

function DockButton({
  label,
  onClick,
  icon,
  danger,
  emphasis,
  disabled
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
  emphasis?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex min-w-[66px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[10px] transition disabled:opacity-55 ${
        danger
          ? "border border-rose-400/40 bg-rose-500/10 text-rose-100"
          : emphasis
            ? "border border-white/30 bg-white text-black"
            : "border border-white/15 bg-white/[0.04] text-white/90"
      }`}
      aria-label={label}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </motion.button>
  );
}

export function RoomControls({ joinedAudio, joiningAudio, micMuted, onJoinAudio, onToggleMic, onInvite, onOpenVexa, onLeave }: RoomControlsProps) {
  const micLabel = !joinedAudio ? (joiningAudio ? "Joining" : "Join audio") : micMuted ? "Unmute" : "Mute";

  return (
    <div className="sticky bottom-[calc(10px+env(safe-area-inset-bottom))] z-20 rounded-[24px] border border-white/15 bg-[#0b0b10]/85 p-2.5 shadow-[0_18px_55px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <DockButton
          label={micLabel}
          onClick={joinedAudio ? onToggleMic : onJoinAudio}
          emphasis={!joinedAudio}
          disabled={joiningAudio}
          icon={joinedAudio ? (micMuted ? <MicOffIcon className="h-4 w-4" /> : <MicIcon className="h-4 w-4" />) : <MicIcon className="h-4 w-4" />}
        />
        <DockButton label="Invite" onClick={onInvite} icon={<UserPlusIcon className="h-4 w-4" />} />
        <DockButton label="Vexa" onClick={onOpenVexa} icon={<BrainSparkIcon className="h-4 w-4" />} />
        <DockButton label="Leave" onClick={onLeave} danger icon={<ExitIcon className="h-4 w-4" />} />
      </div>
    </div>
  );
}

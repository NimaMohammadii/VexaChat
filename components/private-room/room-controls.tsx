"use client";

import { motion } from "framer-motion";
import { AudioWaveIcon, BrainSparkIcon, ChatBubbleIcon, ExitIcon, MicIcon, MicOffIcon, UserPlusIcon } from "@/components/private-room/room-icons";

type RoomControlsProps = {
  joinedAudio: boolean;
  joiningAudio: boolean;
  micMuted: boolean;
  onJoinAudio: () => void;
  onToggleMic: () => void;
  onInvite: () => void;
  onOpenVexa: () => void;
  onToggleChat: () => void;
  chatOpen: boolean;
  onLeave: () => void;
};

function ControlButton({
  label,
  onClick,
  icon,
  emphasis,
  danger
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  emphasis?: boolean;
  danger?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1.5 }}
      transition={{ type: "spring", stiffness: 420, damping: 20 }}
      className={`group flex min-w-[70px] flex-col items-center gap-1 rounded-2xl border px-3 py-2 text-[10px] font-medium tracking-[0.04em] transition ${
        danger
          ? "border-rose-400/45 bg-rose-500/10 text-rose-100 hover:bg-rose-500/15"
          : emphasis
            ? "border-white/35 bg-white text-black"
            : "border-white/15 bg-white/[0.04] text-white/90 hover:border-white/25 hover:bg-white/[0.07]"
      }`}
    >
      <span className="text-current">{icon}</span>
      <span>{label}</span>
    </motion.button>
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
  onToggleChat,
  chatOpen,
  onLeave
}: RoomControlsProps) {
  return (
    <div className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1.4rem)] max-w-xl -translate-x-1/2 rounded-[24px] border border-white/10 bg-black/70 px-3 py-2.5 shadow-[0_14px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center justify-between gap-2">
          {!joinedAudio ? (
            <ControlButton label={joiningAudio ? "Joining…" : "Join Audio"} onClick={onJoinAudio} icon={<AudioWaveIcon className="h-4 w-4" />} emphasis />
          ) : (
            <ControlButton label={micMuted ? "Mic Off" : "Mic On"} onClick={onToggleMic} icon={micMuted ? <MicOffIcon className="h-4 w-4" /> : <MicIcon className="h-4 w-4" />} />
          )}
          <ControlButton label="Invite" onClick={onInvite} icon={<UserPlusIcon className="h-4 w-4" />} />
          <ControlButton label={chatOpen ? "Hide Chat" : "Chat"} onClick={onToggleChat} icon={<ChatBubbleIcon className="h-4 w-4" />} />
          <ControlButton label="Vexa" onClick={onOpenVexa} icon={<BrainSparkIcon className="h-4 w-4" />} />
          <ControlButton label="Leave" onClick={onLeave} icon={<ExitIcon className="h-4 w-4" />} danger />
        </div>
      </div>
    </div>
  );
}

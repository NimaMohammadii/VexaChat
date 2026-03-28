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
      className={`group flex min-w-[60px] flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[10px] font-medium tracking-[0.04em] transition ${
        danger
          ? "border-rose-400/35 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
          : emphasis
            ? "border-[#3de696]/30 bg-[#3de696]/15 text-[#3de696]"
            : "border-white/15 bg-white/[0.04] text-white/75 hover:border-white/25 hover:bg-white/[0.07]"
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
    <div className="fixed bottom-[calc(10px+env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-1.4rem)] max-w-[430px] -translate-x-1/2 rounded-[20px] border border-white/15 border-b-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.065)_0%,rgba(255,255,255,0.022)_45%,rgba(0,0,0,0.06)_100%)] px-3 py-2.5 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.1),0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-[50px]">
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex w-full items-center justify-between gap-1">
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

"use client";

import { motion } from "framer-motion";

type ParticipantBubbleProps = {
  username: string;
  avatarUrl?: string;
  role?: "owner" | "participant";
  isLocal?: boolean;
  isSpeaking?: boolean;
  size?: "lg" | "md" | "sm";
  subtitle?: string;
  vexa?: boolean;
};

const sizeClassMap: Record<NonNullable<ParticipantBubbleProps["size"]>, string> = {
  lg: "h-16 w-16",
  md: "h-14 w-14",
  sm: "h-12 w-12"
};

function initials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "VX";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ParticipantBubble({ username, avatarUrl, role, isLocal, isSpeaking, size = "md", subtitle, vexa }: ParticipantBubbleProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <motion.div
        className={`relative rounded-full p-[3px] ${isSpeaking ? "ring-1 ring-[#f4abc1]/85" : "ring-1 ring-white/15"}`}
        animate={isSpeaking ? { scale: [1, 1.03, 1], boxShadow: ["0 0 0 rgba(244,171,193,0)", "0 0 18px rgba(244,171,193,0.5)", "0 0 0 rgba(244,171,193,0)"] } : { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }}
        transition={{ repeat: isSpeaking ? Infinity : 0, duration: 1.3, ease: "easeInOut" }}
      >
        <div className={`relative overflow-hidden rounded-full border border-white/15 bg-[#1c1c1f] ${sizeClassMap[size]}`}>
          {avatarUrl ? <img src={avatarUrl} alt={username} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/90">{vexa ? "VX" : initials(username)}</div>}
        </div>
        {role === "owner" ? <span className="absolute -right-1 -top-1 rounded-full border border-[#b54b68]/40 bg-[#180f13] px-1 py-[2px] text-[8px] uppercase tracking-[0.1em] text-[#ef9eb6]">Host</span> : null}
        {isLocal ? <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/85 px-1 py-[2px] text-[8px] uppercase tracking-[0.1em] text-white/75">You</span> : null}
      </motion.div>
      <div>
        <p className="max-w-[84px] truncate text-[11px] font-medium text-white/90">{username}</p>
        {subtitle ? <p className="text-[9px] text-white/45">{subtitle}</p> : null}
      </div>
    </div>
  );
}

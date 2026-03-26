"use client";

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
  lg: "h-24 w-24",
  md: "h-20 w-20",
  sm: "h-16 w-16"
};

function initials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "VX";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ParticipantBubble({
  username,
  avatarUrl,
  role,
  isLocal,
  isSpeaking,
  size = "md",
  subtitle,
  vexa
}: ParticipantBubbleProps) {
  const ringClass = isSpeaking
    ? "ring-2 ring-[#b54b68] shadow-[0_0_30px_rgba(181,75,104,0.5)]"
    : "ring-1 ring-white/20";

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className={`relative rounded-full p-1 transition-all ${ringClass}`}>
        <div className={`relative overflow-hidden rounded-full border border-white/15 bg-[#1c1c1f] ${sizeClassMap[size]}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/90">{vexa ? "VX" : initials(username)}</div>
          )}
        </div>
        {role === "owner" ? (
          <span className="absolute -right-1 -top-1 rounded-full border border-[#b54b68]/60 bg-[#2b1118] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#ef9eb6]">Host</span>
        ) : null}
        {isLocal ? (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white/80">You</span>
        ) : null}
      </div>
      <div>
        <p className="max-w-[96px] truncate text-xs font-medium text-white/90">{username}</p>
        {subtitle ? <p className="text-[10px] text-white/50">{subtitle}</p> : null}
      </div>
    </div>
  );
}

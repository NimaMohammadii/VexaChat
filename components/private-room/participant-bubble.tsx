"use client";

type ParticipantBubbleProps = {
  username: string;
  avatarUrl?: string;
  role?: "owner" | "participant";
  isLocal?: boolean;
  isSpeaking?: boolean;
  size?: "md" | "sm" | "xs";
  subtitle?: string;
  vexa?: boolean;
};

const sizeClassMap: Record<NonNullable<ParticipantBubbleProps["size"]>, string> = {
  md: "h-14 w-14",
  sm: "h-11 w-11",
  xs: "h-10 w-10"
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

export function ParticipantBubble({ username, avatarUrl, role, isLocal, isSpeaking, size = "sm", subtitle, vexa }: ParticipantBubbleProps) {
  const ringClass = isSpeaking
    ? "ring-1 ring-[#c46b84]/85 shadow-[0_0_18px_rgba(196,107,132,0.4)]"
    : "ring-1 ring-white/20";

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className={`relative rounded-full p-[2px] transition-all duration-200 ${ringClass}`}>
        <div
          className={`relative overflow-hidden rounded-full border border-white/15 ${sizeClassMap[size]} ${
            vexa ? "bg-[#24131a]" : "bg-[#1c1c1f]"
          }`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white/90">{vexa ? "VX" : initials(username)}</div>
          )}
        </div>

        {role === "owner" ? (
          <span className="absolute -right-1 -top-1 rounded-full border border-[#b54b68]/40 bg-[#1b1115] px-1 py-[1px] text-[7px] uppercase tracking-[0.1em] text-[#ef9eb6]">
            Host
          </span>
        ) : null}

        {isLocal ? (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/90 px-1 py-[1px] text-[7px] uppercase tracking-[0.1em] text-white/80">
            You
          </span>
        ) : null}
      </div>

      <div>
        <p className="max-w-[82px] truncate text-[10px] font-medium text-white/82">{username}</p>
        {subtitle ? <p className="text-[9px] text-white/45">{subtitle}</p> : null}
      </div>
    </div>
  );
}

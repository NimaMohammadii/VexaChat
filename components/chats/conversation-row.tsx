import { motion } from "framer-motion";
import { useState } from "react";
import type { ConversationRow as ConversationRowType } from "@/components/chats/types";

type ConversationRowProps = {
  conversation: ConversationRowType;
  index: number;
  onSelect: (id: string) => void;
};

const avatarGradients = [
  "linear-gradient(135deg,#17090e,#542033)",
  "linear-gradient(135deg,#081018,#203247)",
  "linear-gradient(135deg,#10110d,#313228)",
  "linear-gradient(135deg,#121013,#34203c)",
];

function getAvatarBackground(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

function formatConversationTime(iso?: string | null) {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfMessageDay.getTime()) / 86400000);

  if (diffDays === 0) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function daysLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function ConversationAvatar({ conversation }: { conversation: ConversationRowType }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { friendUser } = conversation;
  const initial = friendUser.displayName?.charAt(0) || friendUser.username?.charAt(0) || "V";

  if (friendUser.avatarUrl && !imageFailed) {
    return (
      <img
        src={friendUser.avatarUrl}
        alt={friendUser.displayName || friendUser.username}
        onError={() => setImageFailed(true)}
        className="h-14 w-14 rounded-[22px] border border-white/10 object-cover shadow-[0_14px_28px_rgba(0,0,0,0.35)]"
      />
    );
  }

  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 text-base font-semibold text-white/84 shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]"
      style={{ background: getAvatarBackground(friendUser.id || friendUser.username) }}
    >
      {initial.toUpperCase()}
    </div>
  );
}

export function ConversationRow({ conversation, index, onSelect }: ConversationRowProps) {
  const displayName = conversation.friendUser.displayName || conversation.friendUser.username;
  const preview = conversation.lastMessage?.text || "Start your conversation";
  const timeLabel = formatConversationTime(conversation.lastMessage?.createdAt);
  const remainingDays = daysLeft(conversation.expiresAt);
  const unreadCount = conversation.unreadCount ?? 0;
  const expiryTone = remainingDays <= 2 ? "text-[#f2abb9] bg-[#5a1628]/20 border-[#893349]/40" : "text-white/40 bg-white/[0.045] border-white/10";

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.26, delay: index * 0.035, ease: "easeOut" }}
      onClick={() => onSelect(conversation.id)}
      className="group relative flex w-full items-center gap-3 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.028))] px-3.5 py-3.5 text-left backdrop-blur-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-300 hover:border-white/14 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.068),rgba(255,255,255,0.032))] active:scale-[0.992]"
    >
      <div className="relative shrink-0">
        <ConversationAvatar conversation={conversation} />
        {conversation.friendUser.isOnline ? (
          <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px] border-[#080808] bg-[#67e8a5] shadow-[0_0_12px_rgba(103,232,165,0.5)]" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-white">{displayName}</p>
              {unreadCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#922d46] px-1.5 text-[10px] font-semibold text-white shadow-[0_6px_18px_rgba(92,20,39,0.36)]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </div>
            <p className="truncate text-[13px] text-white/46">@{conversation.friendUser.username}</p>
          </div>
          {timeLabel ? <p className="shrink-0 pt-0.5 text-[11px] font-medium text-white/34">{timeLabel}</p> : null}
        </div>

        <div className="mt-2 flex items-center gap-2.5">
          <p className="min-w-0 flex-1 truncate text-[13px] leading-5 text-white/58">{preview}</p>
          <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[10px] font-medium ${expiryTone}`}>
            {remainingDays === 0 ? "Ends today" : `${remainingDays}d left`}
          </span>
        </div>
      </div>

      <span className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
    </motion.button>
  );
}

export function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[28px] border border-white/8 bg-white/[0.04] px-3.5 py-3.5 backdrop-blur-[24px]">
      <div className="skeleton-shimmer h-14 w-14 rounded-[22px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="skeleton-shimmer h-4 w-32 rounded-full" />
            <div className="skeleton-shimmer h-3.5 w-20 rounded-full" />
          </div>
          <div className="skeleton-shimmer h-3 w-12 rounded-full" />
        </div>
        <div className="mt-3 flex items-center gap-2.5">
          <div className="skeleton-shimmer h-3.5 flex-1 rounded-full" />
          <div className="skeleton-shimmer h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

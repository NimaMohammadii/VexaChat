import { motion } from "framer-motion";
import { useState } from "react";
import type { ConversationRow as ConversationRowType } from "@/components/chats/types";

type ConversationRowProps = {
  conversation: ConversationRowType;
  index: number;
  onSelect: (id: string) => void;
};

const avatarGradients = [
  "linear-gradient(135deg,#171112,#47212b)",
  "linear-gradient(135deg,#11141a,#243243)",
  "linear-gradient(135deg,#171310,#392618)",
  "linear-gradient(135deg,#121115,#2f2536)",
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

function formatExpiryLabel(remainingDays: number) {
  if (remainingDays === 0) {
    return "Ends today";
  }

  if (remainingDays === 1) {
    return "1 day left";
  }

  return `${remainingDays} days left`;
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
        className="h-12 w-12 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white/88"
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
  const expiryLabel = formatExpiryLabel(remainingDays);
  const expiryTone = remainingDays <= 2 ? "text-[#bb7385]" : "text-white/28";

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, delay: index * 0.03, ease: "easeOut" }}
      onClick={() => onSelect(conversation.id)}
      className="group flex w-full items-center gap-3 border-b border-white/6 py-4 text-left transition hover:bg-white/[0.015] focus-visible:outline-none focus-visible:ring-0 active:opacity-85"
    >
      <div className="relative shrink-0">
        <ConversationAvatar conversation={conversation} />
        {conversation.friendUser.isOnline ? (
          <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-[#8f3147] ring-2 ring-[#040404]" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-white">{displayName}</p>
              {unreadCount > 0 ? <span className="h-1.5 w-1.5 rounded-full bg-[#8f3147]" aria-hidden /> : null}
            </div>
            <p className="mt-0.5 truncate text-[13px] text-white/52">{preview}</p>
          </div>

          <div className="shrink-0 text-right">
            {timeLabel ? <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/30">{timeLabel}</p> : null}
            <p className={`mt-1 text-[11px] font-medium uppercase tracking-[0.08em] ${expiryTone}`}>{expiryLabel}</p>
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p className="truncate text-[12px] uppercase tracking-[0.16em] text-white/20">@{conversation.friendUser.username}</p>
          {unreadCount > 0 ? (
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#bb7385]">
              {unreadCount > 99 ? "99+ unread" : `${unreadCount} unread`}
            </span>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}

export function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-white/6 py-4">
      <div className="skeleton-shimmer h-12 w-12 rounded-full" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton-shimmer h-3.5 w-28 rounded-full" />
            <div className="skeleton-shimmer h-3 w-40 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="skeleton-shimmer h-3 w-12 rounded-full" />
            <div className="skeleton-shimmer h-3 w-16 rounded-full" />
          </div>
        </div>
        <div className="mt-2">
          <div className="skeleton-shimmer h-3 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

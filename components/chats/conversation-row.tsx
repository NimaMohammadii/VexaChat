import { motion } from "framer-motion";
import { useState } from "react";
import type { ConversationRow as ConversationRowType } from "@/components/chats/types";

type ConversationRowProps = {
  conversation: ConversationRowType;
  index: number;
  onSelect: (id: string) => void;
};

function formatConversationTime(iso?: string | null) {
  if (!iso) return "";

  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000);

  if (diffDays === 0) {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

function expiryDays(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function Avatar({ conversation }: { conversation: ConversationRowType }) {
  const [failed, setFailed] = useState(false);
  const { friendUser } = conversation;
  const fallback = (friendUser.displayName?.[0] || friendUser.username?.[0] || "U").toUpperCase();

  if (friendUser.avatarUrl && !failed) {
    return (
      <img
        src={friendUser.avatarUrl}
        alt={friendUser.displayName || friendUser.username}
        onError={() => setFailed(true)}
        className="h-11 w-11 rounded-full object-cover"
      />
    );
  }

  return <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-sm text-white/80">{fallback}</div>;
}

export function ConversationRow({ conversation, index, onSelect }: ConversationRowProps) {
  const displayName = conversation.friendUser.displayName || conversation.friendUser.username;
  const preview = conversation.lastMessage?.text || "Start your conversation";
  const timeLabel = formatConversationTime(conversation.lastMessage?.createdAt);
  const unreadCount = conversation.unreadCount ?? 0;
  const days = expiryDays(conversation.expiresAt);

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      onClick={() => onSelect(conversation.id)}
      className="group flex w-full items-center gap-3 border-b border-white/8 py-4 text-left active:opacity-80"
    >
      <div className="relative shrink-0">
        <Avatar conversation={conversation} />
        {conversation.friendUser.isOnline ? <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#a35367] ring-2 ring-[#050505]" /> : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-white">{displayName}</p>
        <p className="truncate text-[13px] text-white/46">{preview}</p>
      </div>

      <div className="shrink-0 text-right">
        {timeLabel ? <p className="text-[11px] uppercase tracking-[0.08em] text-white/34">{timeLabel}</p> : null}
        <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-white/28">{days === 0 ? "Ends today" : `${days}d left`}</p>
        {unreadCount > 0 ? <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#bb7385]">{unreadCount > 99 ? "99+" : unreadCount} new</p> : null}
      </div>
    </motion.button>
  );
}

export function ConversationRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-white/8 py-4">
      <div className="skeleton-shimmer h-11 w-11 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="skeleton-shimmer h-3.5 w-28 rounded-full" />
        <div className="skeleton-shimmer h-3 w-40 rounded-full" />
      </div>
      <div className="skeleton-shimmer h-3 w-12 rounded-full" />
    </div>
  );
}

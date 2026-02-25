import Link from "next/link";

type RecentChatItem = {
  id: string;
  friendName: string;
  friendUsername: string;
  avatarUrl: string;
  preview: string;
  timeLabel: string;
  unreadCount: number;
};

type RecentListProps = {
  chats: RecentChatItem[];
};

export function RecentList({ chats }: RecentListProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-white">Recent Chats</h2>
        <Link href="/chats" className="text-xs text-white/65 transition hover:text-white">
          See all
        </Link>
      </div>

      <div className="space-y-2.5">
        {chats.length ? chats.map((chat) => (
          <Link key={chat.id} href={`/chats/${chat.id}`} className="liquid-glass flex items-center gap-3 rounded-2xl p-3 transition hover:border-white/45 hover:shadow-[0_18px_36px_rgba(120,185,255,0.28)]">
            <img src={chat.avatarUrl} alt={chat.friendName} className="h-11 w-11 rounded-full border border-white/30 object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm text-white">{chat.friendName}</p>
                <p className="shrink-0 text-[11px] text-white/60">{chat.timeLabel}</p>
              </div>
              <p className="truncate text-xs text-white/70">{chat.preview || `Start chatting with @${chat.friendUsername}`}</p>
            </div>
            {chat.unreadCount > 0 ? <span className="rounded-full bg-[#90d1ff] px-2 py-0.5 text-[10px] font-semibold text-[#0b1020]">{chat.unreadCount}</span> : null}
          </Link>
        )) : (
          <div className="liquid-glass rounded-2xl p-6 text-center text-sm text-white/70">
            No recent chats yet.
          </div>
        )}
      </div>
    </section>
  );
}

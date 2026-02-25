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
        <Link href="/chats" className="text-xs text-white/60 transition hover:text-white">
          See all
        </Link>
      </div>

      <div className="space-y-2.5">
        {chats.length ? chats.map((chat) => (
          <Link key={chat.id} href={`/chats/${chat.id}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-3 backdrop-blur-[12px] transition hover:border-[#7A1E2C]/45 hover:bg-[rgba(255,255,255,0.05)]">
            <img src={chat.avatarUrl} alt={chat.friendName} className="h-11 w-11 rounded-full border border-white/15 object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm text-white">{chat.friendName}</p>
                <p className="shrink-0 text-[11px] text-white/50">{chat.timeLabel}</p>
              </div>
              <p className="truncate text-xs text-white/60">{chat.preview || `Start chatting with @${chat.friendUsername}`}</p>
            </div>
            {chat.unreadCount > 0 ? <span className="rounded-full bg-[#7A1E2C] px-2 py-0.5 text-[10px] font-semibold text-white">{chat.unreadCount}</span> : null}
          </Link>
        )) : (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-sm text-white/55">
            No recent chats yet.
          </div>
        )}
      </div>
    </section>
  );
}

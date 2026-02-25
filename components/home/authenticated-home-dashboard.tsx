import Link from "next/link";
import { HeaderMenuDrawer } from "@/components/header-menu-drawer";
import { ProfileCard } from "@/components/home/profile-card";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentList } from "@/components/home/recent-list";
import { RequestsMini } from "@/components/home/requests-mini";

type RequestItem = {
  id: string;
  sender: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string;
  };
};

type RecentChatItem = {
  id: string;
  friendName: string;
  friendUsername: string;
  avatarUrl: string;
  preview: string;
  timeLabel: string;
  unreadCount: number;
};

type AuthenticatedHomeDashboardProps = {
  displayName: string;
  username: string;
  avatarUrl: string;
  notificationCount: number;
  status: "Online" | "Invisible" | "Busy";
  friendsCount: number;
  onlineFriendsCount: number;
  pendingRequestsCount: number;
  requests: RequestItem[];
  recentChats: RecentChatItem[];
};

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
      <path d="M10 3.2a3.8 3.8 0 0 0-3.8 3.8V8c0 1.4-.5 2.7-1.4 3.8l-.6.8h11.6l-.6-.8A6.2 6.2 0 0 1 13.8 8V7A3.8 3.8 0 0 0 10 3.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.4 14.1a1.6 1.6 0 0 0 3.2 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AuthenticatedHomeDashboard({
  displayName,
  username,
  avatarUrl,
  notificationCount,
  status,
  friendsCount,
  onlineFriendsCount,
  pendingRequestsCount,
  requests,
  recentChats
}: AuthenticatedHomeDashboardProps) {
  return (
    <main className="min-h-screen bg-black px-4 pb-12 text-white">
      <header className="mx-auto grid w-full max-w-3xl grid-cols-[auto_auto_1fr_auto] items-center gap-2.5 pt-6">
        <HeaderMenuDrawer />
        <p className="text-sm tracking-[0.2em]">VEXA</p>
        <label className="flex w-full items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-3 py-2.5 backdrop-blur-[12px] focus-within:border-[#7A1E2C]/45 focus-within:shadow-[0_0_20px_rgba(122,30,44,0.24)]">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-white/55" aria-hidden>
            <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M12.8 12.8 16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            aria-label="Search dashboard"
            placeholder="Search chats, friends..."
            className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/45"
          />
        </label>
        <div className="flex items-center gap-2">
          <Link href="/me" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white/80 transition hover:border-[#7A1E2C]/45 hover:text-white">
            <BellIcon />
            {notificationCount > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-[#7A1E2C] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">{notificationCount > 99 ? "99+" : notificationCount}</span> : null}
          </Link>
          <Link href="/me" className="h-10 w-10 overflow-hidden rounded-full border border-white/20">
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-5 flex w-full max-w-3xl flex-col gap-4">
        <ProfileCard
          avatarUrl={avatarUrl}
          displayName={displayName}
          username={username}
          status={status}
          friendsCount={friendsCount}
          onlineFriendsCount={onlineFriendsCount}
          pendingRequestsCount={pendingRequestsCount}
        />

        <RequestsMini requests={requests} />

        <QuickActions />

        <RecentList chats={recentChats} />
      </section>
    </main>
  );
}

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
    <main className="relative min-h-screen overflow-hidden px-4 pb-12 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#02030a]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 70% at 12% 8%, rgba(116,197,255,0.30) 0%, rgba(116,197,255,0) 68%), radial-gradient(65% 70% at 86% 20%, rgba(214,153,255,0.24) 0%, rgba(214,153,255,0) 64%), radial-gradient(75% 80% at 50% 100%, rgba(106,131,255,0.20) 0%, rgba(106,131,255,0) 62%), linear-gradient(160deg, #050710 0%, #060912 40%, #090d1a 100%)"
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-cyan-300/25 blur-[130px]" />
      <div aria-hidden className="pointer-events-none absolute -right-16 top-36 -z-10 h-72 w-72 rounded-full bg-fuchsia-300/25 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-80 w-80 rounded-full bg-indigo-400/20 blur-[150px]" />

      <header className="liquid-glass mx-auto mt-4 grid w-full max-w-3xl grid-cols-[auto_auto_1fr_auto] items-center gap-2.5 rounded-[30px] px-3 py-3 md:mt-6">
        <HeaderMenuDrawer />
        <p className="text-sm tracking-[0.24em] text-white/90">VEXA</p>
        <label className="liquid-glass-soft flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 focus-within:border-white/45 focus-within:shadow-[0_0_20px_rgba(141,210,255,0.32)]">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-white/65" aria-hidden>
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
          <Link href="/me" className="liquid-glass-soft relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:text-white">
            <BellIcon />
            {notificationCount > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-[#90d1ff] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#0b1020]">{notificationCount > 99 ? "99+" : notificationCount}</span> : null}
          </Link>
          <Link href="/me" className="liquid-glass-soft h-10 w-10 overflow-hidden rounded-full">
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

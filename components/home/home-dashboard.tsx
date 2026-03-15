import Link from "next/link";
import { GoogleAuthControl } from "@/components/google-auth-control";
import type { HomeDashboardData } from "@/lib/home/dashboard";

function countLabel(value: number, label: string) {
  return `${value} ${label}`;
}

function mapLocation(country: string, city: string) {
  if (!country && !city) {
    return "Location private";
  }

  if (country && city) {
    return `${city}, ${country}`;
  }

  return city || country;
}

function Avatar({ avatarUrl, displayName }: { avatarUrl: string; displayName: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />;
  }

  return <span className="text-lg font-semibold text-white/85">{displayName.trim().slice(0, 1).toUpperCase() || "V"}</span>;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M12 2.5a5 5 0 0 0-5 5v2.85c0 .77-.22 1.53-.63 2.18L4.95 14.7c-.3.49.05 1.12.62 1.12h12.86c.57 0 .92-.63.62-1.12l-1.42-2.17a4.18 4.18 0 0 1-.63-2.18V7.5a5 5 0 0 0-5-5Zm0 19a2.4 2.4 0 0 0 2.4-2.02H9.6A2.4 2.4 0 0 0 12 21.5Z" fill="currentColor" />
    </svg>
  );
}

function FriendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M15.4 12.2a4.3 4.3 0 1 0-2.8-7.78 4.3 4.3 0 0 0 2.8 7.78ZM6.75 12.7a3.65 3.65 0 1 0 0-7.3 3.65 3.65 0 0 0 0 7.3Zm0 1.8c-2.44 0-4.45 1.73-4.75 3.98-.05.36.24.69.61.69h7.5a5.7 5.7 0 0 1 2.26-4.67H6.75Zm8.65 0c-2.8 0-5.08 1.98-5.4 4.56-.04.31.21.61.52.61h10.96c.31 0 .56-.3.52-.61-.32-2.58-2.6-4.56-5.4-4.56Z" fill="currentColor" />
    </svg>
  );
}

function ActionIcon({ type }: { type: "meet" | "room" | "chats" }) {
  if (type === "meet") {
    return <span className="text-lg">✨</span>;
  }

  if (type === "room") {
    return <span className="text-lg">🔒</span>;
  }

  return <span className="text-lg">💬</span>;
}

const actionCards = [
  { href: "/meet", title: "Meet", subtitle: "Discover people nearby", icon: "meet" as const },
  { href: "/private-room", title: "Private Room", subtitle: "Invite-only conversations", icon: "room" as const },
  { href: "/chats", title: "Chats", subtitle: "Jump back into active talks", icon: "chats" as const }
];

export function HomeDashboard({ data }: { data: HomeDashboardData }) {
  const profile = data.profile;

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-black text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-16 h-60 w-60 rounded-full bg-[#7f1d34]/30 blur-[120px]" />
        <div className="absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-white/10 blur-[130px]" />
        <div className="absolute bottom-14 left-1/4 h-52 w-52 rounded-full bg-[#470b1d]/35 blur-[110px]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-xl flex-col px-5 pb-[calc(1.4rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
        <header className="rounded-[24px] border border-white/15 bg-white/[0.05] px-4 py-3 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_14px_40px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-11 w-11 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                <Avatar avatarUrl={profile?.avatarUrl ?? ""} displayName={profile?.displayName ?? "Guest"} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">{profile?.displayName ?? "Welcome to Vexa"}</p>
                <p className="truncate text-xs text-white/60">
                  {countLabel(data.stats.friendsCount, "friends")} · {countLabel(data.stats.onlineFriendsCount, "online")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative rounded-2xl border border-white/15 bg-black/30 p-2 text-white/80">
                <BellIcon />
                {data.stats.unreadNotificationsCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#a61f45] px-1 text-[10px] font-semibold">{data.stats.unreadNotificationsCount}</span>}
              </div>
              <div className="relative rounded-2xl border border-white/15 bg-black/30 p-2 text-white/80">
                <FriendIcon />
                {data.stats.pendingFriendRequestsCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#a61f45] px-1 text-[10px] font-semibold">{data.stats.pendingFriendRequestsCount}</span>}
              </div>
            </div>
          </div>
        </header>

        <article className="mt-5 rounded-[30px] border border-white/15 bg-[linear-gradient(160deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_55%,rgba(0,0,0,0.16)_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-[56px]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-3xl border border-white/20 bg-black/40">
                <Avatar avatarUrl={profile?.avatarUrl ?? ""} displayName={profile?.displayName ?? "Guest"} />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">{profile?.displayName ?? "Your social space"}</p>
                <p className="text-sm text-white/55">{profile?.username ?? "@vexa"}</p>
                <p className="mt-1 text-xs text-white/45">{mapLocation(profile?.country ?? "", profile?.city ?? "")}</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-200">Online</span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-white/70">
            {profile?.bio?.trim() || "Meet. Talk. Connect. The smoothest way to stay close with your circle in a quiet, premium space."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Friends</p>
              <p className="mt-1 text-lg font-semibold">{data.stats.friendsCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Online now</p>
              <p className="mt-1 text-lg font-semibold">{data.stats.onlineFriendsCount}</p>
            </div>
          </div>
        </article>

        <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] px-3.5 py-3 backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Live activity</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-white/80">
            <div className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">Friend requests: <span className="font-semibold">{data.stats.pendingFriendRequestsCount}</span></div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">Notifications: <span className="font-semibold">{data.stats.unreadNotificationsCount}</span></div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">Active chats: <span className="font-semibold">{data.stats.activeChatsCount}</span></div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-2.5 py-2">Meet activity: <span className="font-semibold">{data.stats.meetActivityCount}</span></div>
          </div>
        </section>

        <div className="mt-auto space-y-3 pt-5">
          <div className="grid grid-cols-3 gap-2.5">
            {actionCards.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className={`group rounded-3xl border border-white/15 px-3 py-3.5 transition duration-300 ${
                  index === 1
                    ? "bg-[linear-gradient(155deg,rgba(130,27,55,0.8),rgba(40,8,18,0.95))] shadow-[0_14px_35px_rgba(109,15,42,0.34)]"
                    : "bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.025)_55%,rgba(0,0,0,0.12)_100%)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <ActionIcon type={action.icon} />
                  <p className="text-sm font-semibold tracking-tight">{action.title}</p>
                </div>
                <p className="mt-2 text-[11px] leading-tight text-white/65">{action.subtitle}</p>
              </Link>
            ))}
          </div>

          {!data.isAuthenticated && (
            <div className="rounded-3xl border border-white/15 bg-white/[0.045] p-4 text-center backdrop-blur-xl">
              <p className="text-sm text-white/75">Sign in to unlock your full social dashboard.</p>
              <div className="mt-3 flex flex-col items-center gap-2.5">
                <GoogleAuthControl />
                <Link href="/me" className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.15em] text-white/75 transition hover:border-white/30 hover:text-white">
                  Continue to profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

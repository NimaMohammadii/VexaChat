import Link from "next/link";

type ProfileCardProps = {
  avatarUrl: string;
  displayName: string;
  username: string;
  status: "Online" | "Invisible" | "Busy";
  friendsCount: number;
  onlineFriendsCount: number;
  pendingRequestsCount: number;
};

function statusTone(status: ProfileCardProps["status"]) {
  if (status === "Busy") {
    return "bg-rose-400";
  }

  if (status === "Invisible") {
    return "bg-white/60";
  }

  return "bg-emerald-300";
}

export function ProfileCard({ avatarUrl, displayName, username, status, friendsCount, onlineFriendsCount, pendingRequestsCount }: ProfileCardProps) {
  return (
    <section className="liquid-glass relative overflow-hidden rounded-[28px] p-5 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-14 before:bg-gradient-to-b before:from-white/35 before:to-transparent before:content-['']">
      <div className="relative flex items-center gap-4">
        <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full border border-white/40 object-cover" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white">{displayName}</p>
          <p className="truncate text-sm text-white/70">@{username}</p>
          <div className="liquid-glass-soft mt-1.5 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] text-white/80">
            <span className={`h-2 w-2 rounded-full ${statusTone(status)}`} aria-hidden />
            <span>{status}</span>
          </div>
        </div>
        <Link href="/me" className="liquid-glass-soft ml-auto rounded-2xl px-3 py-2 text-xs text-white/85 transition hover:text-white">
          View
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="liquid-glass-soft rounded-2xl px-2 py-3">
          <p className="text-lg font-semibold text-white">{friendsCount}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/60">Friends</p>
        </div>
        <div className="liquid-glass-soft rounded-2xl px-2 py-3">
          <p className="text-lg font-semibold text-white">{onlineFriendsCount}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/60">Online</p>
        </div>
        <div className="liquid-glass-soft rounded-2xl px-2 py-3">
          <p className="text-lg font-semibold text-white">{pendingRequestsCount}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/60">Pending</p>
        </div>
      </div>
    </section>
  );
}

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
    return "bg-[#7A1E2C]";
  }

  if (status === "Invisible") {
    return "bg-white/50";
  }

  return "bg-emerald-400";
}

export function ProfileCard({ avatarUrl, displayName, username, status, friendsCount, onlineFriendsCount, pendingRequestsCount }: ProfileCardProps) {
  return (
    <section className="relative rounded-[28px] border border-white/10 bg-[rgba(255,255,255,0.04)] p-5 shadow-[0_16px_44px_rgba(122,30,44,0.22)] backdrop-blur-[18px] before:pointer-events-none before:absolute before:inset-px before:rounded-[27px] before:border before:border-white/10 before:content-['']">
      <div className="relative flex items-center gap-4">
        <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full border border-white/20 object-cover" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white">{displayName}</p>
          <p className="truncate text-sm text-white/60">@{username}</p>
          <div className="mt-1.5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-2.5 py-1 text-[11px] text-white/75">
            <span className={`h-2 w-2 rounded-full ${statusTone(status)}`} aria-hidden />
            <span>{status}</span>
          </div>
        </div>
        <Link href="/me" className="ml-auto rounded-2xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs text-white/75 transition hover:border-[#7A1E2C]/45 hover:bg-white/[0.06] hover:text-white">
          View
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-3">
          <p className="text-lg font-semibold text-white">{friendsCount}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Friends</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-3">
          <p className="text-lg font-semibold text-white">{onlineFriendsCount}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Online</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-2 py-3">
          <p className="text-lg font-semibold text-white">{pendingRequestsCount}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/55">Pending</p>
        </div>
      </div>
    </section>
  );
}

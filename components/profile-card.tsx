import Link from "next/link";
import Image from "next/image";
import { Profile } from "@/lib/types";

export function ProfileCard({ profile }: { profile: Profile }) {
  const primaryImage = profile.images?.[0] || null;

  return (
    <article className="relative overflow-hidden rounded-xl bg-slate shadow-sm">
      {profile.isTop ? (
        <span className="absolute right-3 top-3 z-10 rounded-full border border-violet-300/35 bg-[linear-gradient(135deg,rgba(0,0,0,0.92),rgba(88,28,135,0.5))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/95 backdrop-blur-sm shadow-[0_0_12px_rgba(168,85,247,0.38)]">
          TOP
        </span>
      ) : null}
      <div className="aspect-[3/4] w-full overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={profile.name}
            width={600}
            height={800}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-[#111111] flex items-center justify-center text-[#333] text-sm" />
        )}
      </div>
      <div className="space-y-3 px-3 pb-3 pt-2">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold leading-tight text-paper">{profile.name}</h2>
          <p className="text-xs text-[#AAAAAA]">{profile.city}</p>
          <p className="text-xs text-[#AAAAAA]">${profile.price}/hr</p>
        </div>
        <Link
          href={`/profile/${profile.id}`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-line px-3 py-1.5 text-xs text-paper transition hover:border-paper"
        >
          View
        </Link>
      </div>
    </article>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Profile } from "@/lib/types";

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="overflow-hidden rounded-xl bg-slate shadow-sm">
      <div className="aspect-[3/4] w-full overflow-hidden">
        <Image
          src={profile.images[0]}
          alt={profile.name}
          width={600}
          height={800}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-3 px-3 pb-3 pt-2">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold leading-tight text-paper">{profile.name}</h2>
          <p className="text-xs text-[#AAAAAA]">{profile.city}</p>
          <p className="text-xs text-[#AAAAAA]">{profile.price}</p>
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

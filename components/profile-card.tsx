import Link from "next/link";
import Image from "next/image";
import { Profile } from "@/lib/types";

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article className="bw-card overflow-hidden">
      <div className="relative h-72 w-full">
        <Image src={profile.images[0]} alt={profile.name} fill className="object-cover" />
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{profile.name}</h2>
          <p className="text-sm text-white/80">{profile.city}</p>
          <p className="text-sm text-white/70">{profile.price}</p>
        </div>
        <Link href={`/profile/${profile.id}`} className="bw-button w-full">
          View Profile
        </Link>
      </div>
    </article>
  );
}

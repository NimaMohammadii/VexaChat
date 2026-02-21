import type { Profile } from "@/lib/types";

export function ProfileCard({ profile }: { profile: Profile }) {
  return (
    <article>
      <h3>{profile.name}</h3>
      <p>{profile.bio ?? ""}</p>
    </article>
  );
}

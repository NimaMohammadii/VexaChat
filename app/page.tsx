import { PublicHeader } from "@/components/public-header";
import { ProfileCard } from "@/components/profile-card";
import { getProfiles } from "@/lib/profile-store";

export default function HomePage() {
  const profiles = getProfiles();

  return (
    <main className="min-h-screen bg-ink">
      <PublicHeader />
      <section className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      </section>
    </main>
  );
}

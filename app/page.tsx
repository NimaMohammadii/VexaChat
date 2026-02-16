import { PublicHeader } from "@/components/public-header";
import { ProfileCard } from "@/components/profile-card";
import { getProfiles } from "@/lib/profile-store";

export default function HomePage() {
  const profiles = getProfiles();

  return (
    <main className="min-h-screen bg-ink text-paper">
      <PublicHeader />
      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-7 border-b border-line pb-12 md:space-y-9 md:pb-16">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
            Premium Private Companion Directory
          </h1>
          <p className="max-w-2xl whitespace-pre-line text-base text-paper md:text-xl md:leading-relaxed">
            {`A curated selection of verified independent companions.
Discreet. Professional. Effortless.`}
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-[#AAAAAA] md:text-base">
            Browse profiles by city, availability, and service. Connect directly and privately.
          </p>
        </div>

        <div className="pt-10 md:pt-12">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-5">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

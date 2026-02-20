import { PublicHeader } from "@/components/public-header";
import { ProfileCard } from "@/components/profile-card";
import { listProfiles } from "@/lib/profiles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profiles = await (async () => {
    try {
      return await listProfiles();
    } catch (error) {
      console.error("Failed to load profiles", error);
      return [];
    }
  })();

  return (
    <main className="min-h-screen bg-ink text-paper">
      <PublicHeader />
      <section className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 py-12 md:py-16">
        <div className="hero-background" aria-hidden="true" />
        <div className="orb orb-1" aria-hidden="true" />
        <div className="orb orb-2" aria-hidden="true" />

        <div className="mx-auto max-w-4xl space-y-7 border-b border-line pb-12 md:space-y-9 md:pb-16">
          <h1 className="max-w-3xl text-3xl font-bold tracking-[0.01em] md:text-5xl md:tracking-[0.02em]">
            <span className="highlight">Premium</span> Private <span className="highlight">Companion</span> Directory
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

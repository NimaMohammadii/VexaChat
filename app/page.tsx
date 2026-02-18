import { PublicHeader } from "@/components/public-header";
import { ProfileCard } from "@/components/profile-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profiles = await prisma.profile.findMany({
    orderBy: [{ isTop: "desc" }, { createdAt: "desc" }]
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <PublicHeader />
      <section className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-6 border-b border-gray-800 pb-12">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Profiles</h1>
          <p className="max-w-2xl text-base text-gray-400 md:text-lg">
            Discover available profiles and explore details before requesting a booking.
          </p>
        </div>

        <div className="pt-10 md:pt-12">
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            {profiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
          {profiles.length === 0 ? (
            <p className="mt-10 text-sm text-gray-500">No profiles available yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

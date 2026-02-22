import { GoogleAuthControl } from "@/components/google-auth-control";
import { ProfileCard } from "@/components/profile-card";
import { PublicHeader } from "@/components/public-header";
import { HomeFilters } from "@/components/home-filters";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function parseList(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function HomePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const city = searchParams.city?.trim() ?? "";
  const min = Number(searchParams.min ?? "");
  const max = Number(searchParams.max ?? "");
  const languages = parseList(searchParams.languages);
  const services = parseList(searchParams.services);
  const sort = searchParams.sort ?? "newest";

  const orderBy =
    sort === "lowest" ? [{ price: "asc" as const }] :
      sort === "highest" ? [{ price: "desc" as const }] :
        sort === "verified" ? [{ verified: "desc" as const }, { createdAt: "desc" as const }] :
          [{ createdAt: "desc" as const }];

  const profiles = await (async () => {
    try {
      return await prisma.profile.findMany({
        where: {
          verified: true,
          city: city ? { contains: city, mode: "insensitive" } : undefined,
          price: {
            gte: Number.isFinite(min) ? min : undefined,
            lte: Number.isFinite(max) ? max : undefined
          },
          languages: languages.length ? { hasSome: languages } : undefined,
          services: services.length ? { hasSome: services } : undefined
        },
        orderBy
      });
    } catch {
      return [];
    }
  })();

  const user = await getAuthenticatedUser({ canSetCookies: false });
  const favorites = await (async () => {
    if (!user) {
      return [];
    }

    try {
      return await prisma.favorite.findMany({ where: { userId: user.id }, select: { profileId: true } });
    } catch {
      return [];
    }
  })();
  const favoriteSet = new Set(favorites.map((item) => item.profileId));

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-paper">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(190,120,255,0.2),transparent_36%),radial-gradient(circle_at_80%_10%,rgba(80,160,255,0.12),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(250,120,190,0.14),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-size:120px_120px] [background-image:radial-gradient(circle,rgba(255,255,255,0.14)_1px,transparent_1px)]" />
      <PublicHeader rightSlot={<GoogleAuthControl />} />

      <section className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 pb-14 pt-12 md:pb-20 md:pt-16">
        <div className="mb-10 space-y-5 text-center md:mb-14 md:space-y-6">
          <h1 className="animate-[pulse_6s_ease-in-out_infinite] bg-gradient-to-r from-white via-fuchsia-200 to-violet-300 bg-clip-text text-4xl font-extrabold uppercase tracking-[0.06em] text-transparent drop-shadow-[0_0_24px_rgba(200,130,255,0.3)] md:text-6xl">
            Vexa Directory
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-white/65 md:text-base">Private connections. Refined discovery. Curated profiles with a premium dark experience.</p>
          <a
            href="#profiles"
            className="inline-flex rounded-full border border-white/20 bg-white/[0.06] px-6 py-2.5 text-sm font-medium text-white transition hover:scale-[1.02] hover:border-white/40 hover:bg-white/[0.12] hover:shadow-[0_0_28px_rgba(255,255,255,0.2)]"
          >
            Start Exploring
          </a>
        </div>

        <HomeFilters />

        <div id="profiles" className="grid grid-cols-2 gap-5 pt-2 md:grid-cols-3 md:gap-7 lg:grid-cols-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="group relative rounded-2xl transition duration-300 hover:scale-[1.02]">
              <div className="overflow-hidden rounded-2xl shadow-[0_14px_42px_rgba(0,0,0,0.38)] transition duration-300 group-hover:shadow-[0_20px_52px_rgba(164,115,255,0.25)]">
                <ProfileCard profile={profile} isFavorite={favoriteSet.has(profile.id)} />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-2xl bg-gradient-to-t from-black/55 via-black/25 to-transparent backdrop-blur-[2px]" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

import { GoogleAuthControl } from "@/components/google-auth-control";
import { HomePageRedesign } from "@/components/home-page-redesign";
import { PublicHeader } from "@/components/public-header";
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

  const favoriteProfileIds = favorites.map((item) => item.profileId);

  const homeSections = await (async () => {
    try {
      return await prisma.homeSection.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }]
      });
    } catch {
      return [];
    }
  })();

  return (
    <>
      <PublicHeader rightSlot={<GoogleAuthControl />} />
      <HomePageRedesign profiles={profiles} favoriteProfileIds={favoriteProfileIds} homeSections={homeSections} />
    </>
  );
}

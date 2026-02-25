"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { GoogleAuthControl } from "@/components/google-auth-control";
import type { Profile } from "@/lib/types";

type HomeSectionItem = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  order: number;
  isActive: boolean;
};

type HomeHeroConfig = {
  heroTitle: string;
  heroAccentWord: string | null;
  heroSubtitle: string;
  primaryCtaText: string;
  secondaryCtaText: string | null;
};

type HomePageRedesignProps = {
  profiles: Profile[];
  favoriteProfileIds: string[];
  homeSections: HomeSectionItem[];
  homepageImages: { id: string; url: string; order: number }[];
  homeHeroConfig: HomeHeroConfig;
};

const placeholderSections: HomeSectionItem[] = [
  {
    id: "placeholder-1",
    title: "Elite profiles curated for your mood",
    subtitle: "Instantly discover premium and verified matches.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    order: 0,
    isActive: true
  },
  {
    id: "placeholder-2",
    title: "Fast private chat",
    subtitle: "Smooth, private, and elegantly minimal.",
    imageUrl: "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=1600&q=80",
    order: 1,
    isActive: true
  },
  {
    id: "placeholder-3",
    title: "High quality vibes",
    subtitle: "A premium mobile flow inspired by iOS apps.",
    imageUrl: "https://images.unsplash.com/photo-1496128858413-b36217c2ce36?auto=format&fit=crop&w=1600&q=80",
    order: 2,
    isActive: true
  }
];

const tabs = [
  { label: "Home", href: "/" },
  { label: "Meet", href: "/meet" },
  { label: "Chats", href: "/chats" },
  { label: "Me", href: "/me" }
];

export function HomePageRedesign({ profiles, favoriteProfileIds, homeSections, homepageImages, homeHeroConfig }: HomePageRedesignProps) {
  const sortedHomepageImages = [...homepageImages].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const displaySections = homeSections.length ? homeSections : placeholderSections;
  const displaySectionsWithImages = displaySections.map((section, index) => ({
    ...section,
    imageUrl: sortedHomepageImages[index]?.url ?? section.imageUrl
  }));

  const featuredProfiles = profiles.slice(0, 6);
  const heroTitle = homeHeroConfig.heroTitle?.trim() || "VexaChat";
  const heroImage = displaySectionsWithImages[0]?.imageUrl ?? placeholderSections[0].imageUrl;

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#060606] text-white">
      <div className="pointer-events-none absolute -left-20 top-28 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-[110px]" />
      <div className="pointer-events-none absolute -right-14 top-40 h-72 w-72 rounded-full bg-violet-500/20 blur-[120px]" />

      <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col gap-3 px-4 pb-4 pt-4 md:gap-4 md:px-6 md:pt-6">
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex items-center justify-between"
        >
          <button type="button" aria-label="Menu" className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs tracking-[0.2em] text-white/85 backdrop-blur">
            MENU
          </button>
          <p className="text-sm tracking-[0.34em] text-white/80">VEXA</p>
          <GoogleAuthControl />
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10"
        >
          <Image src={heroImage} alt={heroTitle} width={1600} height={1100} className="h-[31dvh] w-full object-cover md:h-[34dvh]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">iOS inspired experience</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight md:text-4xl">
              {heroTitle} {homeHeroConfig.heroAccentWord ? <span className="bg-gradient-to-r from-pink-400 to-violet-300 bg-clip-text text-transparent">{homeHeroConfig.heroAccentWord}</span> : null}
            </h1>
            <p className="mt-2 line-clamp-2 max-w-xl text-xs text-white/75 md:text-sm">{homeHeroConfig.heroSubtitle}</p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid grid-cols-3 gap-2"
        >
          <Link href="/meet" className="rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-3 text-center text-xs text-white/90 backdrop-blur hover:bg-white/[0.1]">Explore</Link>
          <Link href="/me/create-profile" className="rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-3 text-center text-xs text-white/90 backdrop-blur hover:bg-white/[0.1]">Create</Link>
          <Link href="/friends" className="rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-3 text-center text-xs text-white/90 backdrop-blur hover:bg-white/[0.1]">Friends</Link>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="min-h-0 flex-1"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-base font-medium text-white/95">Top picks</h2>
            <p className="text-xs text-white/65">{favoriteProfileIds.length}+ likes</p>
          </div>

          <div className="flex h-[calc(100%-2rem)] gap-3 overflow-x-auto overflow-y-hidden pb-2">
            {(featuredProfiles.length ? featuredProfiles : displaySectionsWithImages).slice(0, 6).map((item, index) => {
              const title = "name" in item ? item.name : item.title;
              const subtitle = "city" in item ? item.city || "Tehran" : item.subtitle || "Premium member";
              const imageUrl = "name" in item ? item.imageUrl || item.images?.[0] || placeholderSections[0].imageUrl : item.imageUrl;

              return (
                <article key={`${title}-${index}`} className="group relative h-full min-w-[68%] overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03] md:min-w-[44%]">
                  <Image src={imageUrl} alt={title} width={900} height={1200} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-16">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-xs text-white/75">{subtitle}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </motion.section>

        <nav className="grid grid-cols-4 gap-2 rounded-3xl border border-white/12 bg-white/[0.06] p-2 backdrop-blur-xl">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`rounded-2xl px-2 py-2 text-center text-xs ${tab.href === "/" ? "bg-white text-black" : "text-white/80 hover:bg-white/10"}`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}

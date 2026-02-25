"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
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
    title: "Private matching",
    subtitle: "Precision discovery for intentional connections.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    order: 0,
    isActive: true
  },
  {
    id: "placeholder-2",
    title: "Premium moments",
    subtitle: "Designed for style, calm, and confidence.",
    imageUrl: "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=1600&q=80",
    order: 1,
    isActive: true
  },
  {
    id: "placeholder-3",
    title: "Effortless booking",
    subtitle: "Fast flow with elegant UI.",
    imageUrl: "https://images.unsplash.com/photo-1496128858413-b36217c2ce36?auto=format&fit=crop&w=1600&q=80",
    order: 2,
    isActive: true
  }
];

export function HomePageRedesign({ homeSections, homepageImages, homeHeroConfig }: HomePageRedesignProps) {
  const sortedHomepageImages = [...homepageImages].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const displaySections = homeSections.length ? homeSections : placeholderSections;
  const displaySectionsWithImages = displaySections.slice(0, 3).map((section, index) => ({
    ...section,
    imageUrl: sortedHomepageImages[index]?.url ?? section.imageUrl
  }));

  return (
    <main className="relative h-[calc(100svh-86px)] overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <motion.div
          className="absolute -left-20 top-[10%] h-52 w-52 rounded-full bg-[#FF2E63]/20 blur-3xl md:h-72 md:w-72"
          animate={{ y: [0, -24, 0], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-4rem] top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-3xl md:h-80 md:w-80"
          animate={{ y: [0, 18, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <section className="relative z-10 mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_1fr] gap-6 px-4 py-6 md:grid-cols-[1.1fr_0.9fr] md:grid-rows-1 md:items-center md:gap-8 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[30px] border border-white/20 bg-white/10 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-8"
        >
          <p className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/80 md:text-[11px]">
            Liquid Glass Experience
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-[0.01em] md:text-5xl">
            {homeHeroConfig.heroTitle} {homeHeroConfig.heroAccentWord ? <span className="text-[#FF2E63]">{homeHeroConfig.heroAccentWord}</span> : null}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">{homeHeroConfig.heroSubtitle}</p>

          <div className="mt-5 flex flex-wrap gap-2.5 md:mt-6">
            <Link
              href="/profiles"
              className="rounded-2xl border border-white/35 bg-white px-5 py-2.5 text-sm font-medium text-black transition-all duration-300 hover:scale-[1.03]"
            >
              {homeHeroConfig.primaryCtaText}
            </Link>
            {homeHeroConfig.secondaryCtaText ? (
              <Link
                href="/me/create-profile"
                className="rounded-2xl border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-white/20"
              >
                {homeHeroConfig.secondaryCtaText}
              </Link>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 md:mt-7">
            {displaySectionsWithImages.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.55 }}
                className="rounded-2xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-xl"
              >
                <p className="line-clamp-1 text-[11px] text-white/90 md:text-xs">{item.title}</p>
                <p className="mt-1 line-clamp-2 text-[10px] text-white/60 md:text-[11px]">{item.subtitle}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative mx-auto flex h-full max-h-[540px] w-full max-w-[360px] items-center justify-center"
        >
          <div className="relative h-full max-h-[540px] w-full rounded-[40px] border border-white/30 bg-white/10 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="relative h-full overflow-hidden rounded-[32px] border border-white/15 bg-black/70 p-3">
              <motion.div
                className="absolute -right-3 top-8 rounded-2xl border border-white/20 bg-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/85 backdrop-blur-xl"
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              >
                Live Match
              </motion.div>

              <div className="grid h-full grid-rows-[1fr_1fr] gap-3">
                {displaySectionsWithImages.slice(0, 2).map((item, index) => (
                  <motion.div
                    key={`phone-${item.id}`}
                    className="relative overflow-hidden rounded-[24px]"
                    animate={{ y: [0, index === 0 ? -6 : 6, 0] }}
                    transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 rounded-xl border border-white/20 bg-black/35 px-2 py-1.5 backdrop-blur-lg">
                      <p className="line-clamp-1 text-xs font-medium">{item.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

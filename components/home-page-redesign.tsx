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
    <main className="relative min-h-[calc(100svh-86px)] overflow-hidden bg-[#04050a] text-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,46,99,0.16),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(69,232,255,0.14),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(104,76,255,0.24),transparent_56%)]" />
        <motion.div
          className="absolute -left-10 top-20 h-56 w-56 rounded-full bg-[#FF2E63]/20 blur-3xl md:h-80 md:w-80"
          animate={{ y: [0, -32, 0], opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 top-1/3 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl md:h-72 md:w-72"
          animate={{ y: [0, 20, 0], opacity: [0.4, 0.72, 0.4] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-4 pb-28 pt-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-6 md:pb-36 md:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.28em] text-white/80 md:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF2E63]" />
            Cinematic Discovery
          </p>

          <div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              {homeHeroConfig.heroTitle}{" "}
              {homeHeroConfig.heroAccentWord ? (
                <span className="bg-gradient-to-r from-[#ff3f76] via-[#ff7ca7] to-[#6bf3ff] bg-clip-text text-transparent">{homeHeroConfig.heroAccentWord}</span>
              ) : null}
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">{homeHeroConfig.heroSubtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {displaySectionsWithImages.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.45 }}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs text-white/85 backdrop-blur-md"
              >
                {item.title}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-5 pt-2 text-xs text-white/60 md:text-sm">
            <Link href="/profiles" className="group inline-flex items-center gap-1 font-medium text-white transition hover:text-cyan-200">
              Start browsing
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
            <span className="h-1 w-1 rounded-full bg-white/35" />
            <Link href="/connect" className="transition hover:text-white">Join the private flow</Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="relative mx-auto flex w-full max-w-[430px] items-center justify-center"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[38px] bg-gradient-to-tr from-[#ff2e63]/20 via-transparent to-cyan-300/20 blur-2xl"
            animate={{ opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative grid w-full grid-cols-2 gap-3">
            {displaySectionsWithImages.slice(0, 2).map((item, index) => (
              <motion.article
                key={`scene-${item.id}`}
                animate={{ y: [0, index === 0 ? -12 : 12, 0], rotate: [0, index === 0 ? -1 : 1, 0] }}
                transition={{ duration: 7 + index, repeat: Infinity, ease: "easeInOut" }}
                className={`relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-2 backdrop-blur-xl ${index === 0 ? "mt-8" : "mb-8"}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-[22px]">
                  <Image src={item.imageUrl} alt={item.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-white/20 bg-black/35 px-3 py-2 backdrop-blur-md">
                    <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                    <p className="line-clamp-1 text-[11px] text-white/65">{item.subtitle}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.75 }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-4 md:px-6 md:pb-6"
      >
        <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/[0.08] p-4 backdrop-blur-2xl md:p-5">
          <motion.div
            className="absolute -left-1/4 top-1/2 h-16 w-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent blur-2xl"
            animate={{ x: ["0%", "220%"] }}
            transition={{ duration: 4.6, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative flex flex-wrap items-center gap-2 md:gap-3">
            {["AI Mood Sync", "Live Aura Pulse", "Private Spectrum", "Zero-Friction Match"].map((feature, index) => (
              <motion.span
                key={feature}
                className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/85 md:text-xs"
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.8, delay: index * 0.25, repeat: Infinity, ease: "easeInOut" }}
              >
                {feature}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.section>
    </main>
  );
}

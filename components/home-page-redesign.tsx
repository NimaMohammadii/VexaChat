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

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const placeholderSections: HomeSectionItem[] = [
  {
    id: "placeholder-1",
    title: "Smart Discover",
    subtitle: "Curated matches with premium pacing",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    order: 0,
    isActive: true
  },
  {
    id: "placeholder-2",
    title: "Private Chat",
    subtitle: "Fast, subtle and protected",
    imageUrl: "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=1200&q=80",
    order: 1,
    isActive: true
  },
  {
    id: "placeholder-3",
    title: "VIP Profiles",
    subtitle: "Minimal UI, maximum chemistry",
    imageUrl: "https://images.unsplash.com/photo-1496128858413-b36217c2ce36?auto=format&fit=crop&w=1200&q=80",
    order: 2,
    isActive: true
  }
];

export function HomePageRedesign({ profiles, favoriteProfileIds, homeSections, homepageImages, homeHeroConfig }: HomePageRedesignProps) {
  const sortedImages = [...homepageImages].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const sections = (homeSections.length ? homeSections : placeholderSections).map((section, index) => ({
    ...section,
    imageUrl: sortedImages[index]?.url ?? section.imageUrl
  }));

  const heroImage = sections[0]?.imageUrl ?? placeholderSections[0].imageUrl;
  const cards = profiles.length ? profiles.slice(0, 2).map((profile) => ({
    id: profile.id,
    title: profile.name,
    subtitle: profile.city || "Tehran",
    imageUrl: profile.imageUrl || profile.images?.[0] || heroImage
  })) : sections.slice(1, 3).map((section) => ({
    id: section.id,
    title: section.title,
    subtitle: section.subtitle ?? "Premium profile",
    imageUrl: section.imageUrl
  }));

  return (
    <main className="relative h-[calc(100svh-4.5rem)] max-h-[calc(100svh-4.5rem)] overflow-hidden bg-black px-4 pb-5 pt-4 text-white md:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.28),transparent_62%)]" />
      <div className="pointer-events-none absolute -left-14 top-24 h-52 w-52 rounded-full bg-fuchsia-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-10 top-[40%] h-56 w-56 rounded-full bg-sky-400/20 blur-[110px]" />

      <motion.section initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="relative mx-auto flex h-full w-full max-w-6xl flex-col gap-3">
        <motion.header variants={fadeIn} transition={{ duration: 0.55 }} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-xl">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">Vexa iOS style</p>
            <h1 className="text-sm font-semibold md:text-base">{homeHeroConfig.heroTitle || "VexaChat"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/friends" className="ios-chip">Friends</Link>
            <Link href="/chats" className="ios-chip">Chats</Link>
          </div>
        </motion.header>

        <div className="grid flex-1 gap-3 md:grid-cols-[1.15fr_0.85fr]">
          <motion.article variants={fadeIn} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-[1.8rem] border border-white/10">
            <Image src={heroImage} alt="Home hero" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/80" />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/65">Featured today</p>
              <h2 className="mt-1 text-2xl font-semibold leading-tight md:text-4xl">
                {homeHeroConfig.heroAccentWord || "Private"} connections.
              </h2>
              <p className="mt-2 max-w-md text-xs text-white/75 md:text-sm">{homeHeroConfig.heroSubtitle}</p>
              <div className="mt-3 flex gap-2">
                <Link href="/meet/browse" className="ios-cta-primary">{homeHeroConfig.primaryCtaText}</Link>
                <Link href="/me/create-profile" className="ios-cta-secondary">Start profile</Link>
              </div>
            </div>
          </motion.article>

          <motion.div variants={fadeIn} transition={{ duration: 0.6 }} className="grid grid-rows-[auto_1fr_auto] gap-3">
            <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">Live stats</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="ios-tile">
                  <p className="text-white/60">Profiles</p>
                  <p className="text-lg font-semibold">{profiles.length}+</p>
                </div>
                <div className="ios-tile">
                  <p className="text-white/60">Favorites</p>
                  <p className="text-lg font-semibold">{favoriteProfileIds.length}+</p>
                </div>
              </div>
            </div>

            <div className="grid grid-rows-2 gap-3">
              {cards.map((card) => (
                <article key={card.id} className="group relative overflow-hidden rounded-2xl border border-white/10">
                  <Image src={card.imageUrl} alt={card.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
                  <div className="absolute inset-y-0 left-0 flex flex-col justify-end p-3">
                    <h3 className="text-sm font-semibold md:text-base">{card.title}</h3>
                    <p className="text-xs text-white/70">{card.subtitle}</p>
                  </div>
                </article>
              ))}
            </div>

            <nav className="rounded-2xl border border-white/12 bg-white/[0.08] p-2 backdrop-blur-2xl">
              <ul className="grid grid-cols-4 gap-2 text-center text-[11px] text-white/80">
                <li><Link href="/" className="ios-nav-item ios-nav-active">Home</Link></li>
                <li><Link href="/meet/browse" className="ios-nav-item">Discover</Link></li>
                <li><Link href="/chats" className="ios-nav-item">Inbox</Link></li>
                <li><Link href="/me" className="ios-nav-item">Me</Link></li>
              </ul>
            </nav>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}

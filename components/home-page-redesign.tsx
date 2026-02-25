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

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const placeholderSections: HomeSectionItem[] = [
  {
    id: "placeholder-1",
    title: "VIP discovery built for instant vibe-match",
    subtitle: "Smooth scroll, curated people, and zero visual noise.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    order: 0,
    isActive: true
  },
  {
    id: "placeholder-2",
    title: "Private chats with premium pacing",
    subtitle: "Everything feels personal, secure, and mobile-first.",
    imageUrl: "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=1600&q=80",
    order: 1,
    isActive: true
  },
  {
    id: "placeholder-3",
    title: "Minimal surfaces, maximum chemistry",
    subtitle: "A refined social layer that stays elegant at every touchpoint.",
    imageUrl: "https://images.unsplash.com/photo-1496128858413-b36217c2ce36?auto=format&fit=crop&w=1600&q=80",
    order: 2,
    isActive: true
  }
];

export function HomePageRedesign({ profiles, favoriteProfileIds, homeSections, homepageImages, homeHeroConfig }: HomePageRedesignProps) {
  const sortedHomepageImages = [...homepageImages].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const displaySections = homeSections.length ? homeSections : placeholderSections;
  const displaySectionsWithImages = displaySections.map((section, index) => ({
    ...section,
    imageUrl: sortedHomepageImages[index]?.url ?? section.imageUrl
  }));

  const featuredProfiles = profiles.slice(0, 3);
  const heroTitle = homeHeroConfig.heroTitle?.trim() || "VexaChat";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-x-0 top-16 h-80 bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.22),transparent_62%)]" />
      <div className="pointer-events-none absolute -left-16 top-40 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-14 top-[28rem] h-60 w-60 rounded-full bg-cyan-400/10 blur-[100px]" />

      <section className="relative px-5 pb-10 pt-6 md:px-8 md:pt-10">
        <motion.div
          className="liquid-glass mx-auto max-w-6xl rounded-[2rem] p-4 md:p-7"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={fadeInUp} transition={{ duration: 0.65, ease: "easeOut" }} className="flex items-center justify-between">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/75 md:text-xs">Liquid Glass UI</span>
            <span className="text-xs tracking-[0.18em] text-white/60">Home</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} transition={{ duration: 0.65, ease: "easeOut" }} className="mt-6 text-3xl font-semibold leading-tight tracking-tight md:mt-8 md:text-6xl">
            {heroTitle} {homeHeroConfig.heroAccentWord ? <span className="bg-gradient-to-r from-[#FF4D8D] to-[#9D7BFF] bg-clip-text text-transparent">{homeHeroConfig.heroAccentWord}</span> : null}
          </motion.h1>

          <motion.p variants={fadeInUp} transition={{ duration: 0.65, ease: "easeOut" }} className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
            {homeHeroConfig.heroSubtitle} Designed like a flagship mobile app: ultra-clean, animated, and crafted to make every profile feel premium.
          </motion.p>

          <motion.div variants={fadeInUp} transition={{ duration: 0.65, ease: "easeOut" }} className="mt-7 flex flex-wrap gap-3">
            <Link href="#discover" className="rounded-2xl border border-white/30 bg-white text-sm font-medium text-black shadow-[0_14px_40px_rgba(255,255,255,0.18)] px-5 py-3 transition hover:scale-[1.02]">
              {homeHeroConfig.primaryCtaText}
            </Link>
            {homeHeroConfig.secondaryCtaText ? (
              <Link href="/me/create-profile" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-white backdrop-blur-md transition hover:border-white/40 hover:bg-white/15">
                {homeHeroConfig.secondaryCtaText}
              </Link>
            ) : null}
          </motion.div>

          <motion.div variants={fadeInUp} transition={{ duration: 0.7, ease: "easeOut" }} className="mt-7 grid gap-3 md:grid-cols-3">
            {[
              { label: "Verified Profiles", value: `${profiles.length}+` },
              { label: "Likes Saved", value: `${favoriteProfileIds.length}+` },
              { label: "Response Speed", value: "~2m" }
            ].map((item) => (
              <div key={item.label} className="liquid-tile rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/55">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section id="discover" className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-4 md:px-8 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.article initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInUp} transition={{ duration: 0.65, ease: "easeOut" }} className="liquid-glass overflow-hidden rounded-[1.8rem] p-4 md:p-5">
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <Image src={displaySectionsWithImages[0]?.imageUrl ?? placeholderSections[0].imageUrl} alt={displaySectionsWithImages[0]?.title ?? "Featured visual"} width={1400} height={1000} className="h-[280px] w-full object-cover md:h-[380px]" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Featured Experience</p>
              <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{displaySectionsWithImages[0]?.title ?? "Precision matching for premium people"}</h2>
            </div>
          </div>
        </motion.article>

        <motion.aside initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="grid gap-4">
          {displaySectionsWithImages.slice(1, 3).map((section) => (
            <motion.div key={section.id} variants={fadeInUp} transition={{ duration: 0.6, ease: "easeOut" }} className="liquid-glass rounded-3xl p-4">
              <div className="flex items-start gap-4">
                <Image src={section.imageUrl} alt={section.title} width={120} height={120} className="h-20 w-20 rounded-2xl object-cover" />
                <div>
                  <h3 className="text-base font-semibold">{section.title}</h3>
                  {section.subtitle ? <p className="mt-1 text-sm text-white/65">{section.subtitle}</p> : null}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.aside>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 md:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeInUp} transition={{ duration: 0.65, ease: "easeOut" }} className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold md:text-3xl">Live profile cards</h2>
          <Link href="/chats" className="text-sm text-white/70 transition hover:text-white">Open chats →</Link>
        </motion.div>

        <motion.div className="mt-6 grid gap-4 md:grid-cols-3" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
          {(featuredProfiles.length ? featuredProfiles : displaySectionsWithImages).slice(0, 3).map((item, index) => {
            const title = "name" in item ? item.name : item.title;
            const subtitle = "city" in item ? item.city || "Tehran" : item.subtitle || "Premium member";
            const imageUrl = "name" in item ? item.imageUrl || item.images?.[0] || placeholderSections[0].imageUrl : item.imageUrl;

            return (
              <motion.article key={`${title}-${index}`} variants={fadeInUp} transition={{ duration: 0.6, ease: "easeOut" }} className="liquid-glass group rounded-[1.7rem] p-3">
                <div className="relative overflow-hidden rounded-[1.2rem]">
                  <Image src={imageUrl} alt={title} width={700} height={900} className="h-[300px] w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-16">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-white/70">{subtitle}</p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </section>
    </main>
  );
}

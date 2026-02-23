"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/lib/types";

type HomeSectionItem = {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaText: string | null;
  ctaHref: string | null;
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
  homeHeroConfig: HomeHeroConfig;
};

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

export function HomePageRedesign({ profiles, homeSections, homeHeroConfig }: HomePageRedesignProps) {
  const featuredProfiles = profiles.slice(0, 8);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="flex min-h-screen items-center justify-center px-6 py-32">
        <motion.div className="mx-auto max-w-4xl text-center" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.16 } } }}>
          <motion.p variants={fadeInUp} transition={{ duration: 0.7, ease: "easeOut" }} className="mb-8 inline-flex rounded-full border border-white/[0.06] px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#d6d6d6]">
            Private social editorial
          </motion.p>
          <motion.h1 variants={fadeInUp} transition={{ duration: 0.75, ease: "easeOut" }} className="text-5xl font-semibold leading-[1.08] tracking-[0.02em] md:text-7xl">
            {homeHeroConfig.heroTitle} {homeHeroConfig.heroAccentWord ? <span className="text-[#FF2E63]">{homeHeroConfig.heroAccentWord}</span> : null}
          </motion.h1>
          <motion.p variants={fadeInUp} transition={{ duration: 0.75, ease: "easeOut" }} className="mx-auto mt-10 max-w-2xl text-sm leading-relaxed tracking-[0.02em] text-[#A1A1A1] md:text-lg">
            {homeHeroConfig.heroSubtitle}
          </motion.p>
          <motion.div variants={fadeInUp} transition={{ duration: 0.75, ease: "easeOut" }} className="mt-12 flex justify-center gap-3">
            <Link href="#home-sections" className="inline-flex rounded-full border border-transparent bg-white px-9 py-4 text-sm font-medium tracking-[0.03em] text-black transition-all duration-300 hover:opacity-90 hover:border-[#FF2E63]/70 md:text-base">
              {homeHeroConfig.primaryCtaText}
            </Link>
            {homeHeroConfig.secondaryCtaText ? (
              <Link href="/me/create-profile" className="inline-flex rounded-full border border-white/[0.2] px-9 py-4 text-sm font-medium tracking-[0.03em] text-white transition-all duration-300 hover:border-[#FF2E63]/70 md:text-base">
                {homeHeroConfig.secondaryCtaText}
              </Link>
            ) : null}
          </motion.div>
        </motion.div>
      </section>

      <section id="home-sections" className="mx-auto w-full max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {homeSections.map((section) => (
            <motion.article key={section.id} className="overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#0a0a0a]" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeInUp}>
              <Image src={section.imageUrl} alt={section.title} width={1200} height={900} className="h-56 w-full object-cover" />
              <div className="space-y-4 p-5">
                <h2 className="text-xl font-medium tracking-[0.02em]">{section.title}</h2>
                {section.subtitle ? <p className="text-sm text-[#A1A1A1]">{section.subtitle}</p> : null}
                {section.ctaText && section.ctaHref ? (
                  <Link href={section.ctaHref} className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs transition-colors hover:border-[#FF2E63]/70">
                    {section.ctaText}
                  </Link>
                ) : null}
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="featured-profiles" className="mx-auto w-full max-w-7xl px-6 py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInUp} transition={{ duration: 0.7, ease: "easeOut" }}>
          <h2 className="text-3xl font-semibold tracking-[0.03em] md:text-4xl">Featured Preview</h2>
          <div className="mt-6 h-px w-full bg-white/10" />
        </motion.div>

        <motion.div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          {featuredProfiles.slice(0, 6).map((profile) => (
            <motion.article key={`preview-${profile.id}`} variants={fadeInUp} transition={{ duration: 0.7, ease: "easeOut" }} className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#111111]">
              <div className="aspect-[4/5] overflow-hidden bg-black">
                <Image src={profile.imageUrl || profile.images[0] || "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"} alt={profile.name} width={800} height={1000} className="h-full w-full object-cover" />
              </div>
              <div className="px-4 py-4">
                <h3 className="text-sm font-medium tracking-[0.02em] text-white md:text-base">{profile.name}</h3>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>
    </main>
  );
}

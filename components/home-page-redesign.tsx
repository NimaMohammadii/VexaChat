"use client";

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
    title: "Curated introductions built for calm attention",
    subtitle: "A quieter way to discover verified people and meaningful chemistry.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    order: 0,
    isActive: true
  },
  {
    id: "placeholder-2",
    title: "Intentional moments, designed with privacy first",
    subtitle: "Every touchpoint favors discretion, clarity, and premium simplicity.",
    imageUrl: "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=1600&q=80",
    order: 1,
    isActive: true
  },
  {
    id: "placeholder-3",
    title: "Editorial quality across every profile surface",
    subtitle: "Minimal visuals and thoughtful pacing keep the experience refined.",
    imageUrl: "https://images.unsplash.com/photo-1496128858413-b36217c2ce36?auto=format&fit=crop&w=1600&q=80",
    order: 2,
    isActive: true
  }
];

export function HomePageRedesign({ profiles, homeSections, homepageImages, homeHeroConfig }: HomePageRedesignProps) {
  const sortedHomepageImages = [...homepageImages].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const displaySections = homeSections.length ? homeSections : placeholderSections;
  const displaySectionsWithImages = displaySections.map((section, index) => ({
    ...section,
    imageUrl: sortedHomepageImages[index]?.url ?? section.imageUrl
  }));

  return (
    <main className="relative min-h-[calc(100svh-88px)] overflow-x-hidden overflow-y-clip bg-black text-white">
      <section className="relative flex min-h-[68svh] items-center justify-center px-6 pb-14 pt-10 md:min-h-[76svh] md:pb-16 md:pt-14">
        <svg aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-64 w-64 text-[#FF2E63]/20 blur-[1px] md:h-80 md:w-80" viewBox="0 0 200 200" fill="none">
          <path d="M100 10C149.706 10 190 50.2944 190 100C190 149.706 149.706 190 100 190C50.2944 190 10 149.706 10 100C10 50.2944 50.2944 10 100 10Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M40 100C40 66.8629 66.8629 40 100 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <svg aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 text-white/20 md:h-[24rem] md:w-[24rem]" viewBox="0 0 240 240" fill="none">
          <rect x="30" y="30" width="180" height="180" rx="36" stroke="currentColor" strokeWidth="1.4" />
          <path d="M70 170L170 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="120" cy="120" r="16" fill="currentColor" fillOpacity="0.22" />
        </svg>

        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <p className="group relative mx-auto mb-7 inline-flex overflow-hidden rounded-full border border-white/[0.18] bg-white/[0.08] px-5 py-2 text-[11px] uppercase tracking-[0.2em] text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <span className="pointer-events-none absolute inset-y-[1px] left-[-45%] w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-500 ease-out group-hover:left-[115%] group-hover:opacity-90 group-active:left-[115%]" />
            <span className="relative z-10">Minimal • Modern • Private</span>
          </p>

          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-semibold leading-[1.04] tracking-[0.01em] text-white md:text-6xl lg:text-7xl">
            Bold connections, zero clutter.{" "}
            {homeHeroConfig.heroAccentWord ? (
              <span className="bg-gradient-to-r from-[#cf4d69] via-[#b03a59] to-[#93324a] bg-clip-text text-transparent">
                {homeHeroConfig.heroAccentWord}
              </span>
            ) : null}
          </h1>

          <div className="mx-auto mt-7 max-w-2xl rounded-2xl border border-white/[0.11] bg-black/20 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md md:px-7 md:py-5">
            <p className="text-sm leading-relaxed tracking-[0.01em] text-white/70 md:text-base">
              Modern design, faster rhythm, and cleaner space to spotlight real people. {homeHeroConfig.heroSubtitle}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#home-sections"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/80 bg-white px-8 py-3 text-[15px] font-semibold tracking-[0.02em] text-black shadow-[0_14px_30px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.8)] transition duration-200 active:scale-[0.98]"
            >
              {homeHeroConfig.primaryCtaText}
            </Link>
            {homeHeroConfig.secondaryCtaText ? (
              <Link
                href="/me/create-profile"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/[0.26] bg-white/[0.05] px-8 py-3 text-[15px] font-medium tracking-[0.02em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_0_0_1px_rgba(255,255,255,0.05),0_8px_26px_rgba(114,27,47,0.25)] backdrop-blur-md transition duration-200 hover:border-white/[0.34] active:scale-[0.98]"
              >
                {homeHeroConfig.secondaryCtaText}
              </Link>
            ) : null}
          </div>

          <div className="pointer-events-none absolute -bottom-4 right-0 hidden w-[220px] overflow-hidden rounded-[26px] border border-white/[0.15] bg-white/[0.06] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_16px_30px_rgba(0,0,0,0.42)] backdrop-blur-xl md:block">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/65">Preview</p>
            <div className="mt-3 h-24 rounded-2xl border border-white/[0.12] bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-2">
              <svg viewBox="0 0 120 60" className="h-full w-full text-white/40" fill="none" aria-hidden="true">
                <path d="M6 47C18 36 26 21 40 21C52 21 56 41 71 41C83 41 91 21 114 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="42" cy="21" r="3" fill="currentColor" fillOpacity="0.5" />
                <circle cx="72" cy="41" r="3" fill="currentColor" fillOpacity="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section id="home-sections" className="mx-auto w-full max-w-7xl px-6 pb-12 md:pb-14">
        {displaySectionsWithImages.map((section, index) => {
          const flip = index % 2 === 1;

          return (
            <article key={section.id} className="grid items-center gap-7 py-14 md:py-16 lg:grid-cols-2 lg:gap-10">
              <div className={flip ? "lg:order-2" : ""}>
                <div className="overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#0a0a0a]">
                  <Image src={section.imageUrl} alt={section.title} width={1400} height={1000} className="h-[420px] w-full object-cover md:h-[520px]" />
                </div>
              </div>
              <div className={flip ? "lg:order-1" : ""}>
                <h2 className="text-3xl font-medium leading-tight tracking-[0.01em] md:text-4xl">{section.title}</h2>
                {section.subtitle ? <p className="mt-4 max-w-xl text-base leading-relaxed text-[#A1A1A1] md:text-lg">{section.subtitle}</p> : null}
              </div>
            </article>
          );
        })}
      </section>

      <section id="featured-profiles" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-18">
        <div>
          <h2 className="text-3xl font-semibold tracking-[0.03em] md:text-4xl">Magnetic Preview</h2>
          <div className="mt-4 h-px w-full bg-white/10" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {displaySectionsWithImages.slice(0, 6).map((section) => (
            <article key={`preview-${section.id}`} className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#111111]">
              <div className="aspect-[4/5] overflow-hidden bg-black">
                <Image src={section.imageUrl} alt={section.title} width={800} height={1000} className="h-full w-full object-cover" />
              </div>
              <div className="px-4 py-4">
                <h3 className="text-sm font-medium tracking-[0.02em] text-white md:text-base">{section.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
        <div>
          <h2 className="text-4xl font-semibold tracking-[0.03em] md:text-6xl">Less noise, more impact.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed tracking-[0.02em] text-[#A1A1A1] md:text-base">
            Every card, every line, and every motion is intentional—clean, focused, and unmistakably premium.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20 pt-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-3xl font-semibold tracking-[0.03em] md:text-5xl">Ready to stand out?</p>
          <Link href="/me/create-profile" className="mt-7 inline-flex rounded-full border border-white px-7 py-3 text-sm font-medium tracking-[0.03em] text-white transition-colors duration-300 hover:border-[#FF2E63]/65 hover:bg-white hover:text-black md:text-base">
            Create Your Profile
          </Link>
        </div>
      </section>
    </main>
  );
}

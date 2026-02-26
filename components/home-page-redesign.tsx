"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

function Reveal({ children, className = "", delay = 0, threshold = 0.2 }: { children: ReactNode; className?: string; delay?: number; threshold?: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out will-change-transform ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

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
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <section className="relative flex min-h-[82vh] items-center justify-center px-6 py-20 md:py-24">
        <svg aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-64 w-64 text-[#FF2E63]/20 blur-[1px] md:h-80 md:w-80" viewBox="0 0 200 200" fill="none">
          <path d="M100 10C149.706 10 190 50.2944 190 100C190 149.706 149.706 190 100 190C50.2944 190 10 149.706 10 100C10 50.2944 50.2944 10 100 10Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M40 100C40 66.8629 66.8629 40 100 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <svg aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 text-white/20 md:h-[24rem] md:w-[24rem]" viewBox="0 0 240 240" fill="none">
          <rect x="30" y="30" width="180" height="180" rx="36" stroke="currentColor" strokeWidth="1.4" />
          <path d="M70 170L170 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="120" cy="120" r="16" fill="currentColor" fillOpacity="0.22" />
        </svg>
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Reveal delay={80} threshold={0}>
            <p className="mb-6 inline-flex rounded-full border border-white/[0.1] bg-white/[0.03] px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[#d6d6d6]">
              Minimal • Modern • Private
            </p>
          </Reveal>
          <Reveal delay={160} threshold={0}>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-[0.01em] md:text-6xl lg:text-7xl">
              {homeHeroConfig.heroTitle} {homeHeroConfig.heroAccentWord ? <span className="text-[#FF2E63]">{homeHeroConfig.heroAccentWord}</span> : null}
            </h1>
          </Reveal>
          <Reveal delay={240} threshold={0}>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed tracking-[0.01em] text-[#B2B2B2] md:text-base">
              Modern design, faster rhythm, and cleaner space to spotlight real people. {homeHeroConfig.heroSubtitle}
            </p>
          </Reveal>
          <Reveal delay={320} threshold={0} className="mt-8 flex justify-center gap-2.5">
            <Link href="#home-sections" className="inline-flex rounded-full border border-transparent bg-white px-7 py-3 text-sm font-medium tracking-[0.03em] text-black transition-all duration-300 hover:opacity-90 hover:border-[#FF2E63]/70 md:text-base">
              {homeHeroConfig.primaryCtaText}
            </Link>
            {homeHeroConfig.secondaryCtaText ? (
              <Link href="/me/create-profile" className="inline-flex rounded-full border border-white/[0.2] px-7 py-3 text-sm font-medium tracking-[0.03em] text-white transition-all duration-300 hover:border-[#FF2E63]/70 md:text-base">
                {homeHeroConfig.secondaryCtaText}
              </Link>
            ) : null}
          </Reveal>
        </div>
      </section>

      <section id="home-sections" className="mx-auto w-full max-w-7xl px-6 pb-12 md:pb-14">
        {displaySectionsWithImages.map((section, index) => {
          const flip = index % 2 === 1;

          return (
            <article key={section.id} className="grid items-center gap-7 py-14 md:py-16 lg:grid-cols-2 lg:gap-10">
              <Reveal className={flip ? "lg:order-2" : ""}>
                <div className="overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#0a0a0a]">
                  <Image src={section.imageUrl} alt={section.title} width={1400} height={1000} className="h-[420px] w-full object-cover md:h-[520px]" />
                </div>
              </Reveal>
              <Reveal className={flip ? "lg:order-1" : ""} delay={120}>
                <h2 className="text-3xl font-medium leading-tight tracking-[0.01em] md:text-4xl">{section.title}</h2>
                {section.subtitle ? <p className="mt-4 max-w-xl text-base leading-relaxed text-[#A1A1A1] md:text-lg">{section.subtitle}</p> : null}
              </Reveal>
            </article>
          );
        })}
      </section>

      <section id="featured-profiles" className="mx-auto w-full max-w-7xl px-6 py-16 md:py-18">
        <Reveal threshold={0.3}>
          <h2 className="text-3xl font-semibold tracking-[0.03em] md:text-4xl">Magnetic Preview</h2>
          <div className="mt-4 h-px w-full bg-white/10" />
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {displaySectionsWithImages.slice(0, 6).map((section, index) => (
            <Reveal key={`preview-${section.id}`} className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#111111]" delay={Math.min(index * 80, 320)} threshold={0.1}>
              <div className="aspect-[4/5] overflow-hidden bg-black">
                <Image src={section.imageUrl} alt={section.title} width={800} height={1000} className="h-full w-full object-cover" />
              </div>
              <div className="px-4 py-4">
                <h3 className="text-sm font-medium tracking-[0.02em] text-white md:text-base">{section.title}</h3>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
        <Reveal threshold={0.35}>
          <h2 className="text-4xl font-semibold tracking-[0.03em] md:text-6xl">Less noise, more impact.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed tracking-[0.02em] text-[#A1A1A1] md:text-base">
            Every card, every line, and every motion is intentional—clean, focused, and unmistakably premium.
          </p>
        </Reveal>
      </section>

      <section className="px-6 pb-20 pt-4">
        <Reveal className="mx-auto max-w-3xl text-center" threshold={0.35}>
          <p className="text-3xl font-semibold tracking-[0.03em] md:text-5xl">Ready to stand out?</p>
          <Link href="/me/create-profile" className="mt-7 inline-flex rounded-full border border-white px-7 py-3 text-sm font-medium tracking-[0.03em] text-white transition-colors duration-300 hover:border-[#FF2E63]/65 hover:bg-white hover:text-black md:text-base">
            Create Your Profile
          </Link>
        </Reveal>
      </section>
    </main>
  );
}

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

type HomePageRedesignProps = {
  profiles: Profile[];
  favoriteProfileIds: string[];
  homeSections: HomeSectionItem[];
};

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
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

export function HomePageRedesign({ profiles, homeSections }: HomePageRedesignProps) {
  const featuredProfiles = profiles.slice(0, 8);
  const displaySections = homeSections.length ? homeSections : placeholderSections;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="flex min-h-screen items-center justify-center px-6 py-32">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.16 } } }}
        >
          <motion.p variants={fadeInUp} transition={{ duration: 0.7, ease: "easeOut" }} className="mb-8 inline-flex rounded-full border border-[#FF2E63]/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#d6d6d6]">
            Private social editorial
          </motion.p>
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="text-5xl font-semibold leading-[1.08] tracking-[0.02em] md:text-7xl"
          >
            Where Desire Meets <span className="text-[#FF2E63]">Discretion</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="mx-auto mt-10 max-w-2xl text-sm leading-relaxed tracking-[0.02em] text-[#A1A1A1] md:text-lg"
          >
            Refined discovery for people who value privacy, curation, and meaningful introductions.
          </motion.p>
          <motion.div variants={fadeInUp} transition={{ duration: 0.75, ease: "easeOut" }} className="mt-12">
            <Link
              href="#home-sections"
              className="inline-flex rounded-full border border-transparent bg-white px-9 py-4 text-sm font-medium tracking-[0.03em] text-black transition-all duration-300 hover:opacity-90 hover:border-[#FF2E63]/70 md:text-base"
            >
              Explore the Experience
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section id="home-sections" className="mx-auto w-full max-w-7xl px-6 pb-20">
        {displaySections.map((section, index) => {
          const flip = index % 2 === 1;

          return (
            <motion.article
              key={section.id}
              className={`grid items-center gap-10 py-24 md:py-28 lg:grid-cols-2 lg:gap-16 ${flip ? "" : ""}`}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={{ visible: { transition: { staggerChildren: 0.14 } } }}
            >
              <motion.div variants={fadeInUp} transition={{ duration: 0.7, ease: "easeOut" }} className={flip ? "lg:order-2" : ""}>
                <div className="overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#0a0a0a]">
                  <Image
                    src={section.imageUrl}
                    alt={section.title}
                    width={1400}
                    height={1000}
                    className="h-[420px] w-full object-cover md:h-[520px]"
                  />
                </div>
              </motion.div>
              <motion.div variants={fadeInUp} transition={{ duration: 0.7, ease: "easeOut" }} className={flip ? "lg:order-1" : ""}>
                <h2 className="text-3xl font-medium leading-tight tracking-[0.02em] md:text-5xl">{section.title}</h2>
                {section.subtitle ? <p className="mt-6 max-w-xl text-base leading-relaxed text-[#A1A1A1] md:text-lg">{section.subtitle}</p> : null}
              </motion.div>
            </motion.article>
          );
        })}
      </section>

      <section id="featured-profiles" className="mx-auto w-full max-w-7xl px-6 py-24">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeInUp} transition={{ duration: 0.7, ease: "easeOut" }}>
          <h2 className="text-3xl font-semibold tracking-[0.03em] md:text-4xl">Featured Preview</h2>
          <div className="mt-6 h-px w-full bg-white/10" />
        </motion.div>

        <motion.div
          className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {displaySections.slice(0, 6).map((section) => (
            <motion.article
              key={`preview-${section.id}`}
              variants={fadeInUp}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#111111]"
            >
              <div className="aspect-[4/5] overflow-hidden bg-black">
                <Image src={section.imageUrl} alt={section.title} width={800} height={1000} className="h-full w-full object-cover" />
              </div>
              <div className="px-4 py-4">
                <h3 className="text-sm font-medium tracking-[0.02em] text-white md:text-base">{section.title}</h3>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={fadeInUp} transition={{ duration: 0.8, ease: "easeOut" }}>
          <h2 className="text-4xl font-semibold tracking-[0.04em] md:text-6xl">Privacy is luxury.</h2>
          <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed tracking-[0.02em] text-[#A1A1A1] md:text-base">
            Every connection is intentional. Verified access, curated profiles, and a discreet environment for people who value quality over noise.
          </p>
        </motion.div>
      </section>

      <section className="px-6 pb-28 pt-10">
        <motion.div className="mx-auto max-w-3xl text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={fadeInUp} transition={{ duration: 0.75, ease: "easeOut" }}>
          <p className="text-3xl font-semibold tracking-[0.03em] md:text-5xl">Enter the experience.</p>
          <Link
            href="/me/create-profile"
            className="mt-10 inline-flex rounded-full border border-white px-9 py-4 text-sm font-medium tracking-[0.03em] text-white transition-colors duration-300 hover:border-[#FF2E63]/65 hover:bg-white hover:text-black md:text-base"
          >
            Create Your Profile
          </Link>
        </motion.div>
      </section>
    </main>
  );
}

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/lib/types";

type HomePageRedesignProps = {
  profiles: Profile[];
  favoriteProfileIds: string[];
};

const experienceCards = [
  {
    title: "Private Matchmaking",
    description: "Discreet introductions tailored to your preferences with privacy-first discovery.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
      </svg>
    )
  },
  {
    title: "Exclusive Content Creators",
    description: "Explore verified creators in an elevated social environment built for premium interactions.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m10 9 5 3-5 3V9Z" />
      </svg>
    )
  },
  {
    title: "Real-Life Experiences",
    description: "From private evenings to luxury escapes, connect with people who value authenticity.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 19h16" />
        <path d="M6 19V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v11" />
        <path d="M9 10h6" />
        <path d="M9 14h6" />
      </svg>
    )
  }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

export function HomePageRedesign({ profiles, favoriteProfileIds }: HomePageRedesignProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0B0F] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(123,47,247,0.22),transparent_36%),radial-gradient(circle_at_78%_18%,rgba(241,7,163,0.16),transparent_33%),linear-gradient(180deg,#09090c_0%,#0d0a17_55%,#09090c_100%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(16)].map((_, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-white/35"
            style={{
              width: `${2 + (index % 3)}px`,
              height: `${2 + (index % 3)}px`,
              left: `${(index * 17) % 100}%`,
              top: `${(index * 13) % 100}%`
            }}
            animate={{ y: [0, -22, 0], opacity: [0.18, 0.5, 0.18] }}
            transition={{ duration: 8 + index * 0.25, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <section className="relative flex min-h-screen items-center justify-center px-6 pb-20 pt-28">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.18 } } }}
        >
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 1.05, ease: "easeOut" }}
            className="text-4xl font-semibold tracking-tight md:text-6xl"
          >
            Where Desire Meets Discretion
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mx-auto mt-6 max-w-2xl text-sm text-white/75 md:text-lg"
          >
            Discover verified profiles in a private, premium experience.
          </motion.p>
          <motion.div variants={fadeInUp} transition={{ duration: 1.1, ease: "easeOut" }} className="mt-10">
            <Link
              href="#featured-profiles"
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-9 py-3 text-sm font-medium backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:border-white/35 hover:bg-white/15 hover:shadow-[0_0_32px_rgba(241,7,163,0.28)] md:text-base"
            >
              Start Exploring
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section id="featured-profiles" className="relative mx-auto w-full max-w-7xl px-6 pb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeInUp} transition={{ duration: 0.8 }}>
          <h2 className="text-2xl font-semibold md:text-3xl">Featured Profiles</h2>
          <p className="mt-2 text-sm text-white/65">Handpicked verified profiles in an elevated private setting.</p>
        </motion.div>

        <motion.div
          className="mt-8 flex snap-x gap-5 overflow-x-auto pb-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {profiles.slice(0, 8).map((profile) => {
            const image = profile.images?.[0] || profile.imageUrl || "";
            const isFavorite = favoriteProfileIds.includes(profile.id);

            return (
              <motion.div
                key={profile.id}
                variants={fadeInUp}
                transition={{ duration: 0.75, ease: "easeOut" }}
                className="group relative h-[420px] min-w-[260px] snap-start overflow-hidden rounded-[20px] border border-white/10 bg-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
              >
                <Link href={`/p/${profile.id}`} className="block h-full w-full">
                  {image ? (
                    <Image
                      src={image}
                      alt={profile.name}
                      width={460}
                      height={680}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#16131f] to-[#0e0d14]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute right-4 top-4 rounded-full border border-emerald-300/45 bg-emerald-500/15 px-3 py-1 text-[11px] text-white/90">
                    Verified
                  </div>
                  {isFavorite ? (
                    <div className="absolute left-4 top-4 rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[11px] text-white/90">
                      Saved
                    </div>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="text-lg font-medium">{profile.name}</h3>
                    <p className="text-sm text-white/70">{profile.city}</p>
                  </div>
                </Link>
                <div className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-transparent transition duration-400 group-hover:ring-[#F107A3]/55 group-hover:shadow-[0_0_40px_rgba(123,47,247,0.35)]" />
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-20">
        <motion.h2
          className="text-2xl font-semibold md:text-3xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeInUp}
          transition={{ duration: 0.8 }}
        >
          More Than Just Dating
        </motion.h2>

        <motion.div
          className="mt-8 grid gap-5 md:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {experienceCards.map((card) => (
            <motion.article
              key={card.title}
              variants={fadeInUp}
              transition={{ duration: 0.75 }}
              className="group rounded-[18px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition duration-300 hover:border-[#7B2FF7]/60 hover:shadow-[0_0_34px_rgba(241,7,163,0.2)]"
            >
              <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-2.5 text-white/90">{card.icon}</div>
              <h3 className="mt-4 text-lg font-medium">{card.title}</h3>
              <p className="mt-2 text-sm text-white/70">{card.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="relative px-6 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.8 }}
          className="mx-auto w-full max-w-6xl rounded-[20px] border border-[#F107A3]/35 bg-[#11111a] px-8 py-14 text-center shadow-[0_0_45px_rgba(123,47,247,0.2)]"
        >
          <p className="text-xl font-medium md:text-3xl">Join the most private social experience.</p>
          <motion.a
            href="/me/create-profile"
            className="relative mt-8 inline-flex rounded-full bg-gradient-to-r from-[#7B2FF7] to-[#F107A3] px-8 py-3 text-sm font-semibold text-white shadow-[0_0_26px_rgba(241,7,163,0.45)]"
            animate={{ boxShadow: ["0 0 16px rgba(241,7,163,0.25)", "0 0 34px rgba(123,47,247,0.5)", "0 0 16px rgba(241,7,163,0.25)"] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            Create Your Profile
          </motion.a>
        </motion.div>
      </section>
    </main>
  );
}

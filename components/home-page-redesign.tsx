"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Profile } from "@/lib/types";

type HomePageRedesignProps = {
  profiles: Profile[];
  favoriteProfileIds: string[];
};

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 }
};

export function HomePageRedesign({ profiles }: HomePageRedesignProps) {
  const featuredProfiles = profiles.slice(0, 8);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="flex min-h-screen items-center justify-center px-6 py-32">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.14 } } }}
        >
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="text-5xl font-bold leading-[1.05] tracking-[0.03em] md:text-7xl"
          >
            Private Connections.
            <br />
            Redefined.
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="mx-auto mt-10 max-w-2xl text-sm leading-relaxed tracking-[0.02em] text-[#A1A1A1] md:text-lg"
          >
            A private social experience designed for discretion and elegance.
          </motion.p>
          <motion.div variants={fadeInUp} transition={{ duration: 0.75, ease: "easeOut" }} className="mt-12">
            <Link
              href="#featured-profiles"
              className="inline-flex rounded-full bg-white px-9 py-4 text-sm font-medium tracking-[0.03em] text-black transition-opacity duration-300 hover:opacity-85 md:text-base"
            >
              Explore Profiles
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section id="featured-profiles" className="mx-auto w-full max-w-7xl px-6 py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="text-3xl font-semibold tracking-[0.03em] md:text-4xl">Featured Profiles</h2>
          <div className="mt-6 h-px w-full bg-white/10" />
        </motion.div>

        <motion.div
          className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {featuredProfiles.map((profile) => {
            const image = profile.images?.[0] || profile.imageUrl || "";

            return (
              <motion.article
                key={profile.id}
                variants={fadeInUp}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#111111]"
              >
                <Link href={`/p/${profile.id}`} className="group block h-full">
                  <div className="aspect-[3/4] overflow-hidden bg-black">
                    {image ? (
                      <Image
                        src={image}
                        alt={profile.name}
                        width={500}
                        height={700}
                        className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="h-full w-full bg-[#0a0a0a]" />
                    )}
                  </div>
                  <div className="px-5 py-5">
                    <h3 className="text-base font-medium tracking-[0.02em] text-white">{profile.name}</h3>
                    <p className="mt-1 text-sm tracking-[0.02em] text-[#A1A1A1]">{profile.city}</p>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-32 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeInUp}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-4xl font-semibold tracking-[0.04em] md:text-6xl">Privacy is luxury.</h2>
          <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed tracking-[0.02em] text-[#A1A1A1] md:text-base">
            Every connection is intentional. Verified access, curated profiles, and a discreet environment for people who value quality over noise.
          </p>
        </motion.div>
      </section>

      <section className="px-6 py-32">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
          variants={fadeInUp}
          transition={{ duration: 0.75, ease: "easeOut" }}
        >
          <p className="text-3xl font-semibold tracking-[0.03em] md:text-5xl">Enter the experience.</p>
          <Link
            href="/me/create-profile"
            className="mt-10 inline-flex rounded-full border border-white px-9 py-4 text-sm font-medium tracking-[0.03em] text-white transition-colors duration-300 hover:bg-white hover:text-black md:text-base"
          >
            Create Your Profile
          </Link>
        </motion.div>
      </section>
    </main>
  );
}

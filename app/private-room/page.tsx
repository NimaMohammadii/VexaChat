"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

const creators = ["Noir Studio", "Miro Atelier", "Selene House", "Velvet Room"];
const access = [
  { title: "Essential", detail: "Editorial previews and private browsing." },
  { title: "Premier", detail: "Priority drops and curated creator highlights." },
  { title: "Signature", detail: "Full private-room access with early invitations." }
];

export default function PrivateRoomPage() {
  return (
    <main className="min-h-screen bg-black px-6 pb-24 pt-24 text-white">
      <motion.section initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.14 } } }} className="mx-auto max-w-5xl text-center">
        <motion.p variants={fadeUp} transition={{ duration: 0.7 }} className="mb-6 inline-flex rounded-full border border-[#FF2E63]/60 px-4 py-1.5 text-xs uppercase tracking-[0.24em] text-white/75">
          Private Room
        </motion.p>
        <motion.h1 variants={fadeUp} transition={{ duration: 0.75 }} className="text-5xl font-semibold tracking-tight md:text-7xl">
          A quieter space for premium introductions.
        </motion.h1>
        <motion.p variants={fadeUp} transition={{ duration: 0.75 }} className="mx-auto mt-7 max-w-2xl text-sm leading-relaxed text-[#A1A1A1] md:text-lg">
          Designed with editorial clarity, discreet access, and calm pacing.
        </motion.p>
      </motion.section>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="mx-auto mt-28 max-w-6xl">
        <motion.h2 variants={fadeUp} transition={{ duration: 0.7 }} className="text-3xl font-medium md:text-4xl">Featured Creators</motion.h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creators.map((name) => (
            <motion.article key={name} variants={fadeUp} transition={{ duration: 0.7 }} className="rounded-[22px] border border-white/[0.06] bg-[#101010] p-5">
              <div className="mb-14 aspect-[4/5] rounded-2xl border border-white/[0.06] bg-[#161616]" />
              <p className="text-base font-medium">{name}</p>
              <p className="mt-1 text-xs tracking-[0.12em] text-[#A1A1A1]">EDITORIAL PROFILE</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="mx-auto mt-28 max-w-6xl">
        <motion.h2 variants={fadeUp} transition={{ duration: 0.7 }} className="text-3xl font-medium md:text-4xl">Access Levels</motion.h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {access.map((tier) => (
            <motion.article key={tier.title} variants={fadeUp} transition={{ duration: 0.7 }} className="rounded-[22px] border border-white/[0.06] bg-[#101010] p-6">
              <p className="text-xl font-medium">{tier.title}</p>
              <p className="mt-4 text-sm leading-relaxed text-[#A1A1A1]">{tier.detail}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.75 }} className="mx-auto mt-28 max-w-4xl rounded-[28px] border border-white/[0.06] bg-[#101010] p-10 text-center">
        <h3 className="text-3xl font-semibold md:text-4xl">Request Private Room Access</h3>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-[#A1A1A1] md:text-base">Join a refined, private-first experience. Access requests are reviewed for fit and intent.</p>
        <button className="mt-8 rounded-full border border-transparent bg-white px-8 py-3 text-sm font-medium text-black transition hover:border-[#FF2E63]/70 hover:opacity-90">
          Submit Interest
        </button>
      </motion.section>
    </main>
  );
}

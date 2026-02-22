"use client";

import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" }
  }
};

const creators = [
  { name: "Aria Sol", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80" },
  { name: "Nina Vale", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80" },
  { name: "Luna Mare", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80" },
  { name: "Elise Noir", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80" },
  { name: "Cora Lux", image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=900&q=80" },
  { name: "Mila Rose", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80" },
  { name: "Sienna Ivy", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80" },
  { name: "Zara Faye", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80" }
];

const tiers = [
  { title: "Basic Access", description: "Explore curated private feeds and unlock previews.", price: "$XX / month" },
  { title: "VIP Access", description: "Priority entry, creator highlights, and premium drops.", price: "$XX / month" },
  { title: "Inner Circle", description: "Full private room access with elite-only experiences.", price: "$XX / month" }
];

const perks = ["Exclusive Content", "Direct Messaging", "Subscriber-Only Media", "Secure & Private"];

function AbstractIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path d="M12 2.8c3.5 0 6.4 2.7 6.4 6.1v2.6M5.6 11.5V8.9c0-3.4 2.9-6.1 6.4-6.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <rect x="4" y="10.3" width="16" height="10.7" rx="4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="15.8" r="1.6" fill="currentColor" />
    </svg>
  );
}

export default function PrivateRoomPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white">
      <motion.section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-24" initial="hidden" animate="show" variants={container}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(123,47,247,0.25),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(241,7,163,0.18),transparent_40%),linear-gradient(180deg,#0B0B0F,#100A1A)]" />
        <motion.div className="absolute -left-20 top-16 h-64 w-64 rounded-full bg-[#7B2FF7]/30 blur-[110px]" animate={{ opacity: [0.35, 0.6, 0.35] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-[#F107A3]/20 blur-[120px]" animate={{ opacity: [0.25, 0.5, 0.25] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

        <motion.div variants={fadeUp} className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.4em] text-white/60">Private Access</p>
          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Enter the Inner Circle</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/75 md:text-lg">Unlock exclusive profiles, premium content, and private access.</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }} className="mt-10 rounded-2xl border border-white/30 bg-white/10 px-10 py-4 text-sm font-medium tracking-[0.16em] shadow-[0_0_35px_rgba(241,7,163,0.26)] backdrop-blur-md transition hover:border-[#F107A3]/70 hover:shadow-[0_0_45px_rgba(123,47,247,0.35)]">
            Explore Creators
          </motion.button>
        </motion.div>
      </motion.section>

      <motion.section className="mx-auto max-w-7xl px-6 py-20" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={container}>
        <motion.h2 variants={fadeUp} className="mb-8 text-3xl font-semibold tracking-tight md:text-4xl">
          Featured Creators
        </motion.h2>
        <motion.div variants={fadeUp} className="flex gap-6 overflow-x-auto pb-2">
          {creators.map((creator) => (
            <motion.article key={creator.name} whileHover={{ scale: 1.03 }} className="group relative min-w-[250px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_26px_rgba(241,7,163,0.14)]">
              <img src={creator.image} alt={creator.name} className="h-[330px] w-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="mb-2 inline-flex rounded-full border border-[#F107A3]/45 bg-[#F107A3]/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/90">Premium</div>
                <p className="text-lg font-medium">{creator.name}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>

      <motion.section className="mx-auto max-w-7xl px-6 py-20" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} variants={container}>
        <motion.h2 variants={fadeUp} className="mb-8 text-3xl font-semibold tracking-tight md:text-4xl">
          Access Levels
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <motion.article key={tier.title} variants={fadeUp} whileHover={{ y: -4 }} className="rounded-3xl border border-white/15 bg-white/[0.03] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_25px_rgba(123,47,247,0.16)] backdrop-blur">
              <div className="mb-4 inline-flex rounded-xl border border-white/25 p-2 text-[#F5D8FF]">
                <AbstractIcon />
              </div>
              <h3 className="text-xl font-medium">{tier.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{tier.description}</p>
              <p className="mt-6 text-sm tracking-[0.14em] text-[#F8C7EA]">{tier.price}</p>
            </motion.article>
          ))}
        </div>
      </motion.section>

      <motion.section className="mx-auto max-w-7xl px-6 py-20" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={container}>
        <motion.h2 variants={fadeUp} className="mb-8 text-3xl font-semibold tracking-tight md:text-4xl">
          Why Private Room
        </motion.h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk) => (
            <motion.div key={perk} variants={fadeUp} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 text-[#F3CCFF]">
                <AbstractIcon />
              </div>
              <p className="text-sm tracking-[0.06em] text-white/90">{perk}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section className="mx-auto max-w-4xl px-6 pb-24 pt-10" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.7, ease: "easeOut" }}>
        <div className="rounded-[24px] border border-[#F107A3]/35 bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-6 py-12 text-center shadow-[0_0_45px_rgba(241,7,163,0.2)] backdrop-blur-sm">
          <p className="text-3xl font-semibold tracking-tight md:text-4xl">Step Into Something Private.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} animate={{ boxShadow: ["0 0 20px rgba(123,47,247,0.25)", "0 0 32px rgba(123,47,247,0.4)", "0 0 20px rgba(123,47,247,0.25)"] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="rounded-2xl bg-[#7B2FF7] px-7 py-3 text-sm font-medium tracking-[0.14em]">
              Become a Creator
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className="rounded-2xl border border-white/30 bg-transparent px-7 py-3 text-sm font-medium tracking-[0.14em] text-white/90">
              Subscribe Now
            </motion.button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

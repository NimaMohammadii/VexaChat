import { motion } from "framer-motion";

export function ChatsEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] px-6 py-10 text-center backdrop-blur-[30px] shadow-[0_24px_64px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)]"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(135,37,59,0.28),rgba(255,255,255,0.04)_65%,rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <svg viewBox="0 0 24 24" className="h-9 w-9 text-white/70" fill="none" aria-hidden>
          <path d="M7.5 16.5 4 19l1.2-4.2A5.5 5.5 0 0 1 4 11.5C4 8.46 6.69 6 10 6h4c3.31 0 6 2.46 6 5.5S17.31 17 14 17H7.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 11.5h6M9 8.9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-white">No conversations yet</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/46">
        Your inbox is beautifully quiet. Search for a username above to start your first private thread.
      </p>
    </motion.div>
  );
}

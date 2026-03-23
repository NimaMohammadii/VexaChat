import { motion } from "framer-motion";

export function ChatsEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="border-t border-white/8 py-10"
    >
      <p className="text-base font-medium tracking-[-0.02em] text-white/82">No conversations yet.</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-white/42">
        Search for a username above to begin your first private thread.
      </p>
    </motion.div>
  );
}

import { motion } from "framer-motion";

export function ChatsEmptyState() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="py-10">
      <p className="text-base text-white/82">No conversations yet.</p>
      <p className="mt-1 text-sm text-white/46">Search for a username above to start your first thread.</p>
    </motion.div>
  );
}

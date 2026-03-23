import { AnimatePresence } from "framer-motion";
import { ChatsEmptyState } from "@/components/chats/chats-empty-state";
import { ConversationRow, ConversationRowSkeleton } from "@/components/chats/conversation-row";
import type { ConversationRow as ConversationRowType } from "@/components/chats/types";

type ConversationListProps = {
  conversations: ConversationRowType[];
  loading: boolean;
  onSelectConversation: (conversationId: string) => void;
};

export function ConversationList({ conversations, loading, onSelectConversation }: ConversationListProps) {
  return (
    <section className="flex-1 pb-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Inbox</p>
          <p className="mt-1 text-sm text-white/52">Clean, focused, and ready to reply.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <ConversationRowSkeleton />
          <ConversationRowSkeleton />
          <ConversationRowSkeleton />
        </div>
      ) : conversations.length ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {conversations.map((conversation, index) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                index={index}
                onSelect={onSelectConversation}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <ChatsEmptyState />
      )}
    </section>
  );
}

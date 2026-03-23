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
    <section className="flex-1 pb-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-white/32">Recent</p>
        {!loading && conversations.length ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/22">{conversations.length} threads</p>
        ) : null}
      </div>

      {loading ? (
        <div>
          <ConversationRowSkeleton />
          <ConversationRowSkeleton />
          <ConversationRowSkeleton />
          <ConversationRowSkeleton />
        </div>
      ) : conversations.length ? (
        <div>
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

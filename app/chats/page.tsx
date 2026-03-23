"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatSearchBar } from "@/components/chats/chat-search-bar";
import { ChatsPageShell } from "@/components/chats/chats-page-shell";
import { ConversationList } from "@/components/chats/conversation-list";
import type { ConversationRow, SearchUser } from "@/components/chats/types";

export default function ChatsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const response = await fetch("/api/chats/list", { cache: "no-store" });

        if (!response.ok || !active) {
          return;
        }

        const data = (await response.json()) as { conversations: ConversationRow[] };
        setConversations(data.conversations ?? []);
      } finally {
        if (active) {
          setLoadingConversations(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }

    let active = true;
    const timeout = setTimeout(() => {
      setSearching(true);

      void (async () => {
        try {
          const response = await fetch(`/api/chats/search?username=${encodeURIComponent(query.trim())}`);
          const data = (await response.json()) as { users: SearchUser[] };

          if (active) {
            setResults(data.users ?? []);
          }
        } finally {
          if (active) {
            setSearching(false);
          }
        }
      })();
    }, 220);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((first, second) =>
        (second.lastMessage?.createdAt ?? "").localeCompare(first.lastMessage?.createdAt ?? "")
      ),
    [conversations]
  );

  const openConversation = async (userId: string) => {
    const response = await fetch("/api/chats/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: userId }),
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { conversation: { id: string } };
    router.push(`/chats/${data.conversation.id}`);
  };

  return (
    <ChatsPageShell conversationCount={sortedConversations.length}>
      <ChatSearchBar
        query={query}
        onQueryChange={setQuery}
        searching={searching}
        results={results}
        onOpenConversation={openConversation}
      />

      <ConversationList
        conversations={sortedConversations}
        loading={loadingConversations}
        onSelectConversation={(conversationId) => router.push(`/chats/${conversationId}`)}
      />
    </ChatsPageShell>
  );
}

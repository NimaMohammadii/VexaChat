export type SearchUser = {
  id: string;
  username: string;
  avatarUrl: string;
  bio: string;
};

export type ConversationRow = {
  id: string;
  friendUser: {
    id: string;
    username: string;
    avatarUrl: string;
    displayName?: string | null;
    isOnline?: boolean | null;
  };
  lastMessage: {
    text: string;
    createdAt: string;
  } | null;
  expiresAt: string;
  unreadCount?: number | null;
};

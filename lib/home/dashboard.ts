import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

type AuthenticatedUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
};

export type HomeDashboardData = {
  isAuthenticated: boolean;
  profile: {
    displayName: string;
    username: string;
    avatarUrl: string;
    bio: string;
    country: string;
    city: string;
  } | null;
  stats: {
    friendsCount: number;
    onlineFriendsCount: number;
    pendingFriendRequestsCount: number;
    unreadNotificationsCount: number;
    activeChatsCount: number;
    meetActivityCount: number;
  };
};

export async function getHomeDashboardData(user: AuthenticatedUser | null): Promise<HomeDashboardData> {
  if (!user) {
    return {
      isAuthenticated: false,
      profile: null,
      stats: {
        friendsCount: 0,
        onlineFriendsCount: 0,
        pendingFriendRequestsCount: 0,
        unreadNotificationsCount: 0,
        activeChatsCount: 0,
        meetActivityCount: 0
      }
    };
  }

  const now = new Date();
  const [profile, friendsCount, pendingFriendRequestsCount, unreadNotificationsCount, activeChatsCount, unreadMeetNotifications, pendingMeetLikes] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: {
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        country: true,
        city: true
      }
    }),
    prisma.friendRequest.count({
      where: {
        status: "accepted",
        OR: [{ senderId: user.id }, { receiverId: user.id }]
      }
    }),
    prisma.friendRequest.count({
      where: {
        receiverId: user.id,
        status: "pending"
      }
    }),
    prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    }),
    prisma.conversation.count({
      where: {
        expiresAt: { gt: now },
        OR: [{ userAId: user.id }, { userBId: user.id }]
      }
    }),
    prisma.meetNotification.count({
      where: {
        userId: user.id,
        readAt: null
      }
    }),
    prisma.meetLikeRequest.count({
      where: {
        toUserId: user.id,
        status: "pending"
      }
    })
  ]);

  // NOTE: There is no reliable persisted online-presence model in the current schema.
  // We intentionally return 0 for now so the UI stays truthful and this can be
  // swapped with a real presence source later.
  const onlineFriendsCount = 0;

  const displayName = profile?.name?.trim() || user.user_metadata?.full_name || user.user_metadata?.name || user.email || "Vexa User";
  const username = profile?.username?.trim() ? `@${profile.username.trim()}` : "@newmember";

  return {
    isAuthenticated: true,
    profile: {
      displayName,
      username,
      avatarUrl: profile?.avatarUrl
        ? await resolveStoredFileUrl(profile.avatarUrl)
        : user.user_metadata?.avatar_url ?? "",
      bio: profile?.bio ?? "",
      country: profile?.country ?? "",
      city: profile?.city ?? ""
    },
    stats: {
      friendsCount,
      onlineFriendsCount,
      pendingFriendRequestsCount,
      unreadNotificationsCount,
      activeChatsCount,
      meetActivityCount: unreadMeetNotifications + pendingMeetLikes
    }
  };
}

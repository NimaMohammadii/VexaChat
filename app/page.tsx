import { GoogleAuthControl } from "@/components/google-auth-control";
import { AuthenticatedHomeDashboard } from "@/components/home/authenticated-home-dashboard";
import { HomePageRedesign } from "@/components/home-page-redesign";
import { PublicHeader } from "@/components/public-header";
import { ensureHomePageConfig } from "@/lib/homepage-config";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function parseList(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatRelativeTime(value: Date | null | undefined) {
  if (!value) {
    return "Now";
  }

  const diffMs = Date.now() - value.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default async function HomePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const city = searchParams.city?.trim() ?? "";
  const min = Number(searchParams.min ?? "");
  const max = Number(searchParams.max ?? "");
  const languages = parseList(searchParams.languages);
  const services = parseList(searchParams.services);
  const sort = searchParams.sort ?? "newest";

  const user = await getAuthenticatedUser({ canSetCookies: false });

  if (user) {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { name: true, username: true, avatarUrl: true }
    }).catch(() => null);

    const [pendingRequests, acceptedRequests, notificationCount, conversations] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { receiverId: user.id, status: "pending" },
        orderBy: { createdAt: "desc" },
        take: 6
      }).catch(() => []),
      prisma.friendRequest.findMany({
        where: {
          status: "accepted",
          OR: [{ senderId: user.id }, { receiverId: user.id }]
        },
        select: { senderId: true, receiverId: true }
      }).catch(() => []),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }).catch(() => 0),
      prisma.conversation.findMany({
        where: {
          expiresAt: { gt: new Date() },
          OR: [{ userAId: user.id }, { userBId: user.id }]
        },
        include: {
          messages: {
            select: { text: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        },
        orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
        take: 5
      }).catch(() => [])
    ]);

    const friendIds = Array.from(new Set(acceptedRequests.map((item) => item.senderId === user.id ? item.receiverId : item.senderId)));

    const [friendProfiles, requestSenderProfiles, unreadNotifications] = await Promise.all([
      friendIds.length
        ? prisma.userProfile.findMany({
            where: { userId: { in: friendIds } },
            select: { userId: true }
          }).catch(() => [])
        : Promise.resolve([]),
      pendingRequests.length
        ? prisma.userProfile.findMany({
            where: { userId: { in: pendingRequests.map((item) => item.senderId) } },
            select: { userId: true, name: true, username: true, avatarUrl: true }
          }).catch(() => [])
        : Promise.resolve([]),
      conversations.length
        ? prisma.notification.groupBy({
            by: ["entityId"],
            where: {
              userId: user.id,
              isRead: false,
              entityId: { in: conversations.map((item) => item.id) }
            },
            _count: { _all: true }
          }).catch(() => [])
        : Promise.resolve([])
    ]);

    const requestProfileById = new Map(requestSenderProfiles.map((item) => [item.userId, item]));
    const friendProfileById = new Map(friendProfiles.map((item) => [item.userId, item]));
    const unreadByConversationId = new Map(unreadNotifications.map((item) => [item.entityId, item._count._all]));

    const conversationFriendIds = Array.from(
      new Set(conversations.map((item) => item.userAId === user.id ? item.userBId : item.userAId))
    );

    const recentFriendProfiles = conversationFriendIds.length
      ? await prisma.userProfile.findMany({
          where: { userId: { in: conversationFriendIds } },
          select: { userId: true, username: true, name: true, avatarUrl: true }
        }).catch(() => [])
      : [];

    const recentFriendProfileById = new Map(recentFriendProfiles.map((item) => [item.userId, item]));

    const onlineFriendIds = new Set(
      conversations
        .filter((item) => item.lastMessageAt && Date.now() - item.lastMessageAt.getTime() <= 1000 * 60 * 15)
        .map((item) => item.userAId === user.id ? item.userBId : item.userAId)
        .filter((id) => friendProfileById.has(id))
    );

    const fallbackName = user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? "VEXA User";
    const fallbackAvatar = user.user_metadata.avatar_url || "https://placehold.co/120x120/101010/FFFFFF?text=V";

    return (
      <AuthenticatedHomeDashboard
        displayName={userProfile?.name || fallbackName}
        username={userProfile?.username || "member"}
        avatarUrl={userProfile?.avatarUrl ? await resolveStoredFileUrl(userProfile.avatarUrl) : fallbackAvatar}
        notificationCount={notificationCount}
        status="Online"
        friendsCount={friendIds.length}
        onlineFriendsCount={onlineFriendIds.size}
        pendingRequestsCount={pendingRequests.length}
        requests={await Promise.all(pendingRequests.map(async (request) => {
          const sender = requestProfileById.get(request.senderId);
          return {
            id: request.id,
            sender: {
              id: request.senderId,
              username: sender?.username ?? "unknown",
              name: sender?.name ?? sender?.username ?? "Unknown",
              avatarUrl: sender?.avatarUrl ? await resolveStoredFileUrl(sender.avatarUrl) : "https://placehold.co/80x80/101010/FFFFFF?text=%40"
            }
          };
        }))}
        recentChats={await Promise.all(conversations.map(async (conversation) => {
          const friendId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
          const friendProfile = recentFriendProfileById.get(friendId);
          return {
            id: conversation.id,
            friendName: friendProfile?.name ?? friendProfile?.username ?? "Unknown",
            friendUsername: friendProfile?.username ?? "unknown",
            avatarUrl: friendProfile?.avatarUrl ? await resolveStoredFileUrl(friendProfile.avatarUrl) : "https://placehold.co/80x80/111111/FFFFFF?text=%40",
            preview: conversation.messages[0]?.text ?? "Start your conversation",
            timeLabel: formatRelativeTime(conversation.messages[0]?.createdAt ?? conversation.lastMessageAt ?? conversation.updatedAt),
            unreadCount: unreadByConversationId.get(conversation.id) ?? 0
          };
        }))}
      />
    );
  }

  const orderBy =
    sort === "lowest" ? [{ price: "asc" as const }] :
      sort === "highest" ? [{ price: "desc" as const }] :
        sort === "verified" ? [{ verified: "desc" as const }, { createdAt: "desc" as const }] :
          [{ createdAt: "desc" as const }];

  const profiles = await (async () => {
    try {
      return await prisma.profile.findMany({
        where: {
          verified: true,
          city: city ? { contains: city, mode: "insensitive" } : undefined,
          price: {
            gte: Number.isFinite(min) ? min : undefined,
            lte: Number.isFinite(max) ? max : undefined
          },
          languages: languages.length ? { hasSome: languages } : undefined,
          services: services.length ? { hasSome: services } : undefined
        },
        orderBy
      });
    } catch {
      return [];
    }
  })();

  const favoriteProfileIds: string[] = [];

  const homeHeroConfig = await (async () => {
    try {
      return await ensureHomePageConfig();
    } catch {
      return null;
    }
  })();

  const homeSections = await (async () => {
    try {
      const sections = await prisma.homeSection.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }]
      });

      return Promise.all(
        sections.map(async (section) => ({
          ...section,
          imageUrl: await resolveStoredFileUrl(section.imageUrl)
        }))
      );
    } catch {
      return [];
    }
  })();

  const homepageImages = await (async () => {
    try {
      const images = await prisma.homepageImage.findMany({
        where: { slot: "homepage" },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        select: { id: true, order: true, storagePath: true }
      });

      return Promise.all(images.map(async (image) => ({
        id: image.id,
        order: image.order,
        url: image.storagePath ? await resolveStoredFileUrl(image.storagePath) : ""
      })));
    } catch {
      return [];
    }
  })();

  return (
    <>
      <PublicHeader rightSlot={<GoogleAuthControl />} />
      <HomePageRedesign profiles={profiles} favoriteProfileIds={favoriteProfileIds} homeSections={homeSections} homepageImages={homepageImages} homeHeroConfig={homeHeroConfig ?? { heroTitle: "Where Desire Meets", heroAccentWord: "Discretion", heroSubtitle: "Refined discovery for people who value privacy, curation, and meaningful introductions.", primaryCtaText: "Explore the Experience", secondaryCtaText: "Create Your Profile" }} />
    </>
  );
}

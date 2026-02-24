import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.message.deleteMany({
      where: {
        conversation: {
          OR: [{ userAId: user.id }, { userBId: user.id }],
          expiresAt: { lte: now }
        }
      }
    }),
    prisma.conversation.deleteMany({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }],
        expiresAt: { lte: now }
      }
    })
  ]);

  const conversations = await prisma.conversation.findMany({
    where: {
      expiresAt: { gt: now },
      OR: [{ userAId: user.id }, { userBId: user.id }]
    },
    include: {
      messages: {
        select: { text: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }]
  });

  const friendIds = Array.from(
    new Set(
      conversations.map((conversation) =>
        conversation.userAId === user.id ? conversation.userBId : conversation.userAId
      )
    )
  );

  const friendProfiles = friendIds.length
    ? await prisma.userProfile.findMany({
        where: { userId: { in: friendIds } },
        select: { userId: true, username: true, avatarUrl: true }
      })
    : [];

  const friendById = new Map(friendProfiles.map((profile) => [profile.userId, profile]));

  return NextResponse.json({
    conversations: await Promise.all(conversations.map(async (conversation) => {
      const friendId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
      const friend = friendById.get(friendId);
      const lastMessage = conversation.messages[0] ?? null;

      return {
        id: conversation.id,
        friendUser: {
          id: friendId,
          username: friend?.username ?? "unknown",
          avatarUrl: friend?.avatarUrl ? await resolveStoredFileUrl(friend.avatarUrl) : ""
        },
        lastMessage: lastMessage ? { text: lastMessage.text ?? "", createdAt: lastMessage.createdAt } : null,
        expiresAt: conversation.expiresAt,
        lastMessageAt: conversation.lastMessageAt
      };
    }))
  });
}

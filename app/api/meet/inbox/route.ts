import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [incoming, outgoing, matches, notifications] = await Promise.all([
    prisma.meetLikeRequest.findMany({ where: { toUserId: user.id, status: "pending" }, orderBy: { createdAt: "desc" } }),
    prisma.meetLikeRequest.findMany({ where: { fromUserId: user.id }, orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.meetMatch.findMany({ where: { OR: [{ userLowId: user.id }, { userHighId: user.id }] }, orderBy: { createdAt: "desc" } }),
    prisma.meetNotification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 })
  ]);

  const profileIds = new Set<string>();
  incoming.forEach((item) => profileIds.add(item.fromUserId));
  outgoing.forEach((item) => profileIds.add(item.toUserId));
  matches.forEach((item) => profileIds.add(item.userLowId === user.id ? item.userHighId : item.userLowId));

  const cards = await prisma.meetCard.findMany({
    where: { userId: { in: Array.from(profileIds) } },
    select: { userId: true, displayName: true, age: true, city: true, imageUrl: true }
  });

  const cardsWithUrls = await Promise.all(cards.map(async (card) => ({ ...card, imageUrl: await resolveStoredFileUrl(card.imageUrl) })));
  const cardByUser = Object.fromEntries(cardsWithUrls.map((card) => [card.userId, card]));

  return NextResponse.json({ incoming, outgoing, matches, notifications, cardByUser, currentUserId: user.id });
}

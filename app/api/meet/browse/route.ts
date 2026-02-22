import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

const TAKE_COUNT = 25;

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [ownCard, sentRequests, incomingRequests, passes, blocksFromMe, blocksToMe] = await Promise.all([
    prisma.meetCard.findUnique({ where: { userId: user.id } }),
    prisma.meetLikeRequest.findMany({ where: { fromUserId: user.id }, select: { toUserId: true } }),
    prisma.meetLikeRequest.findMany({ where: { toUserId: user.id }, select: { fromUserId: true } }),
    prisma.meetPass.findMany({ where: { fromUserId: user.id }, select: { toUserId: true } }),
    prisma.meetBlock.findMany({ where: { blockerUserId: user.id }, select: { blockedUserId: true } }),
    prisma.meetBlock.findMany({ where: { blockedUserId: user.id }, select: { blockerUserId: true } })
  ]);

  const excludedUserIds = new Set<string>([
    user.id,
    ...sentRequests.map((item) => item.toUserId),
    ...incomingRequests.map((item) => item.fromUserId),
    ...passes.map((item) => item.toUserId),
    ...blocksFromMe.map((item) => item.blockedUserId),
    ...blocksToMe.map((item) => item.blockerUserId)
  ]);

  const cards = await prisma.meetCard.findMany({
    where: {
      userId: { notIn: Array.from(excludedUserIds) },
      isActive: true,
      isAdultConfirmed: true,
      ...(ownCard?.lookingFor && ownCard.lookingFor !== "any" ? { gender: ownCard.lookingFor } : {})
    },
    orderBy: { createdAt: "desc" },
    take: TAKE_COUNT
  });

  return NextResponse.json({ cards });
}

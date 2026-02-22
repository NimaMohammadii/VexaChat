import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.meetCard.findUnique({ where: { userId: user.id } });
  if (!me || !me.isAdultConfirmed || me.age < 18) {
    return NextResponse.json({ error: "Complete your 18+ Meet card first." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();

  const [likes, passes, blocksByMe, blocksAgainstMe] = await Promise.all([
    prisma.meetLike.findMany({ where: { fromUserId: user.id }, select: { toUserId: true } }),
    prisma.meetPass.findMany({ where: { fromUserId: user.id }, select: { toUserId: true } }),
    prisma.meetBlock.findMany({ where: { blockerUserId: user.id }, select: { blockedUserId: true } }),
    prisma.meetBlock.findMany({ where: { blockedUserId: user.id }, select: { blockerUserId: true } })
  ]);

  const excludeUserIds = new Set<string>([
    user.id,
    ...likes.map((r) => r.toUserId),
    ...passes.map((r) => r.toUserId),
    ...blocksByMe.map((r) => r.blockedUserId),
    ...blocksAgainstMe.map((r) => r.blockerUserId)
  ]);

  const queue = await prisma.meetCard.findMany({
    where: {
      userId: { notIn: Array.from(excludeUserIds) },
      isActive: true,
      isAdultConfirmed: true,
      age: { gte: 18 },
      city: city ? { contains: city, mode: "insensitive" } : undefined,
      AND: [
        {
          OR: [
            { gender: me.lookingFor },
            { gender: "other" },
            ...(me.lookingFor === "any" ? [{ gender: { not: "" } }] : [])
          ]
        },
        {
          OR: [
            { lookingFor: me.gender },
            { lookingFor: "any" }
          ]
        }
      ]
    },
    orderBy: { updatedAt: "desc" },
    take: 20
  });

  return NextResponse.json({ cards: queue });
}

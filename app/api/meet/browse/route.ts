import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

const TAKE_COUNT = 25;

type BrowseCardRow = {
  id: string;
  userId: string;
  displayName: string;
  age: number;
  countryCode: string;
  city: string;
  gender: string;
  lookingFor: string;
  intentTags: string[];
  bio: string | null;
  imageUrl: string;
  isAdultConfirmed: boolean;
  adultConfirmedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [blocksFromMe, blocksToMe] = await Promise.all([
    prisma.meetBlock.findMany({ where: { blockerUserId: user.id }, select: { blockedUserId: true } }),
    prisma.meetBlock.findMany({ where: { blockedUserId: user.id }, select: { blockerUserId: true } })
  ]);

  const excludedUserIds = [
    user.id,
    ...blocksFromMe.map((item) => item.blockedUserId),
    ...blocksToMe.map((item) => item.blockerUserId)
  ];

  const cards = await prisma.$queryRaw<BrowseCardRow[]>(Prisma.sql`
    SELECT *
    FROM "MeetCard"
    WHERE "isActive" = true
      AND "imageUrl" IS NOT NULL
      AND "imageUrl" <> ''
      AND NOT ("userId" = ANY(ARRAY[${Prisma.join(excludedUserIds)}]::text[]))
    ORDER BY random()
    LIMIT ${TAKE_COUNT}
  `);

  const cardsWithUrls = await Promise.all(
    cards.map(async (card) => ({ ...card, imageUrl: await resolveStoredFileUrl(card.imageUrl) }))
  );

  return NextResponse.json({ cards: cardsWithUrls });
}

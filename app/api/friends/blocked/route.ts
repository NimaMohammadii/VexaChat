import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.userBlock.findMany({
    where: { blockerId: user.id },
    orderBy: { createdAt: "desc" },
    select: { blockedId: true }
  });

  const blockedIds = rows.map((item) => item.blockedId);

  const profiles = blockedIds.length
    ? await prisma.userProfile.findMany({
        where: { userId: { in: blockedIds } },
        select: { userId: true, username: true, avatarUrl: true, bio: true, identityVerified: true }
      })
    : [];

  const profileMap = new Map(profiles.map((item) => [item.userId, item]));

  return NextResponse.json({
    blocked: await Promise.all(blockedIds.map(async (blockedId) => {
      const profile = profileMap.get(blockedId);
      return {
        id: blockedId,
        username: profile?.username ?? "unknown",
        avatarUrl: profile?.avatarUrl ? await resolveStoredFileUrl(profile.avatarUrl) : "",
        bio: (profile?.bio ?? "").slice(0, 120),
        verified: Boolean(profile?.identityVerified),
        relationship: "blocked" as const
      };
    }))
  });
}

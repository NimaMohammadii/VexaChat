import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.friendRequest.findMany({
    where: {
      status: "accepted",
      OR: [{ senderId: user.id }, { receiverId: user.id }]
    },
    orderBy: { updatedAt: "desc" }
  });

  const friendIds = links.map((item) => (item.senderId === user.id ? item.receiverId : item.senderId));

  const profiles = friendIds.length
    ? await prisma.userProfile.findMany({
        where: { userId: { in: friendIds } },
        select: { userId: true, username: true, avatarUrl: true, bio: true, identityVerified: true }
      })
    : [];

  const profileMap = new Map(profiles.map((item) => [item.userId, item]));

  return NextResponse.json({
    friends: await Promise.all(friendIds.map(async (friendId) => {
      const profile = profileMap.get(friendId);
      return {
        id: friendId,
        username: profile?.username ?? "unknown",
        avatarUrl: profile?.avatarUrl ? await resolveStoredFileUrl(profile.avatarUrl) : "",
        bio: (profile?.bio ?? "").slice(0, 120),
        verified: Boolean(profile?.identityVerified)
      };
    }))
  });
}

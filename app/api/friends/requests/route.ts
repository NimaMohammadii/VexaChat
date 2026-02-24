import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.friendRequest.findMany({
    where: {
      receiverId: user.id,
      status: "pending"
    },
    orderBy: { createdAt: "desc" }
  });

  const senderIds = requests.map((item) => item.senderId);
  const profiles = senderIds.length
    ? await prisma.userProfile.findMany({
        where: { userId: { in: senderIds } },
        select: { userId: true, username: true, avatarUrl: true, bio: true, identityVerified: true }
      })
    : [];

  const profileByUserId = new Map(profiles.map((item) => [item.userId, item]));

  return NextResponse.json({
    requests: await Promise.all(requests.map(async (item) => ({
      id: item.id,
      createdAt: item.createdAt,
      sender: {
        id: item.senderId,
        username: profileByUserId.get(item.senderId)?.username ?? "unknown",
        avatarUrl: profileByUserId.get(item.senderId)?.avatarUrl ? await resolveStoredFileUrl(profileByUserId.get(item.senderId)!.avatarUrl) : "",
        bio: (profileByUserId.get(item.senderId)?.bio ?? "").slice(0, 120),
        verified: Boolean(profileByUserId.get(item.senderId)?.identityVerified)
      }
    })))
  });
}

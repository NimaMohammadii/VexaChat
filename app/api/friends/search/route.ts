import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim() ?? "";

  if (username.length < 3) {
    return NextResponse.json({ error: "Username query must be at least 3 characters." }, { status: 400 });
  }

  const blockedRows = await prisma.userBlock.findMany({
    where: {
      OR: [{ blockerId: user.id }, { blockedId: user.id }]
    },
    select: {
      blockerId: true,
      blockedId: true
    }
  });

  const blockedUserIds = Array.from(
    new Set(blockedRows.map((row) => (row.blockerId === user.id ? row.blockedId : row.blockerId)))
  );

  const profiles = await prisma.userProfile.findMany({
    where: {
      userId: { notIn: [user.id, ...blockedUserIds] },
      username: { startsWith: username, mode: "insensitive" }
    },
    orderBy: { username: "asc" },
    take: 10,
    select: {
      userId: true,
      username: true,
      avatarUrl: true,
      bio: true,
      identityVerified: true
    }
  });

  const userIds = profiles.map((item) => item.userId);
  const requestRows = userIds.length
    ? await prisma.friendRequest.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: { in: userIds } },
            { senderId: { in: userIds }, receiverId: user.id }
          ]
        },
        orderBy: { updatedAt: "desc" }
      })
    : [];

  const relationshipByUser = new Map<string, "none" | "pending" | "friends">();

  for (const row of requestRows) {
    const otherUserId = row.senderId === user.id ? row.receiverId : row.senderId;
    if (relationshipByUser.has(otherUserId)) continue;

    if (row.status === "accepted") relationshipByUser.set(otherUserId, "friends");
    else if (row.status === "pending") relationshipByUser.set(otherUserId, "pending");
    else relationshipByUser.set(otherUserId, "none");
  }

  return NextResponse.json({
    users: profiles.map((item) => ({
      id: item.userId,
      username: item.username,
      avatarUrl: item.avatarUrl,
      bio: item.bio.slice(0, 120),
      verified: item.identityVerified,
      relationship: relationshipByUser.get(item.userId) ?? "none"
    }))
  });
}

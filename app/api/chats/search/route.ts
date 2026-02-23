import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { areUsersFriends, areUsersBlocked } from "@/lib/chats";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim() ?? "";

  if (username.length < 3) {
    return NextResponse.json({ users: [] });
  }

  const profiles = await prisma.userProfile.findMany({
    where: {
      userId: { not: user.id },
      username: { startsWith: username, mode: "insensitive" }
    },
    select: { userId: true, username: true, avatarUrl: true, bio: true },
    orderBy: { username: "asc" },
    take: 20
  });

  const filtered = [] as { id: string; username: string; avatarUrl: string; bio: string }[];
  for (const profile of profiles) {
    const [isFriend, isBlocked] = await Promise.all([
      areUsersFriends(user.id, profile.userId),
      areUsersBlocked(user.id, profile.userId)
    ]);

    if (isFriend && !isBlocked) {
      filtered.push({
        id: profile.userId,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio.slice(0, 120)
      });
    }

    if (filtered.length >= 10) {
      break;
    }
  }

  return NextResponse.json({ users: filtered });
}

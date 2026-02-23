import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { areUsersBlocked, areUsersFriends, buildConversationExpiry, canonicalConversationPair } from "@/lib/chats";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { otherUserId?: string };
  const otherUserId = body.otherUserId?.trim();

  if (!otherUserId || otherUserId === user.id) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }

  const [isFriend, isBlocked] = await Promise.all([
    areUsersFriends(user.id, otherUserId),
    areUsersBlocked(user.id, otherUserId)
  ]);

  if (!isFriend || isBlocked) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pair = canonicalConversationPair(user.id, otherUserId);

  const existing = await prisma.conversation.findUnique({
    where: { userAId_userBId: pair }
  });

  if (existing) {
    if (existing.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Chat expired" }, { status: 410 });
    }

    return NextResponse.json({ conversation: existing });
  }

  const now = new Date();
  const created = await prisma.conversation.create({
    data: {
      ...pair,
      startedAt: now,
      expiresAt: buildConversationExpiry(now)
    }
  });

  return NextResponse.json({ conversation: created });
}

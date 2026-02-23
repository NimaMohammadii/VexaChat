import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { areUsersBlocked, areUsersFriends, buildConversationExpiry, canonicalConversationPair } from "@/lib/chats";

export async function POST(request: Request, { params }: { params: { conversationId: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { text?: string; otherUserId?: string };
  const text = body.text?.trim() ?? "";

  if (!text) {
    return NextResponse.json({ error: "Message text required" }, { status: 400 });
  }

  let conversation = await prisma.conversation.findUnique({ where: { id: params.conversationId } });

  if (!conversation) {
    const otherUserId = body.otherUserId?.trim();
    if (!otherUserId || otherUserId === user.id) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const [isFriend, isBlocked] = await Promise.all([
      areUsersFriends(user.id, otherUserId),
      areUsersBlocked(user.id, otherUserId)
    ]);

    if (!isFriend || isBlocked) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pair = canonicalConversationPair(user.id, otherUserId);
    const now = new Date();
    conversation = await prisma.conversation.upsert({
      where: { userAId_userBId: pair },
      create: {
        ...pair,
        startedAt: now,
        expiresAt: buildConversationExpiry(now),
        lastMessageAt: now
      },
      update: {}
    });
  }

  if (conversation.userAId !== user.id && conversation.userBId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const otherUserId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
  const [isFriend, isBlocked] = await Promise.all([
    areUsersFriends(user.id, otherUserId),
    areUsersBlocked(user.id, otherUserId)
  ]);

  if (!isFriend || isBlocked) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (conversation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Chat expired" }, { status: 410 });
  }

  const now = new Date();
  const [, message] = await prisma.$transaction([
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: now }
    }),
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        type: "text",
        text
      }
    })
  ]);

  return NextResponse.json({ message, conversationId: conversation.id });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const expired = await prisma.conversation.findMany({
    where: { expiresAt: { lt: now } },
    select: { id: true }
  });

  const conversationIds = expired.map((item) => item.id);

  if (!conversationIds.length) {
    return NextResponse.json({ deletedConversations: 0, deletedMessages: 0 });
  }

  const [deletedMessages, deletedConversations] = await prisma.$transaction([
    prisma.message.deleteMany({ where: { conversationId: { in: conversationIds } } }),
    prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } })
  ]);

  return NextResponse.json({ deletedConversations: deletedConversations.count, deletedMessages: deletedMessages.count });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

const PAGE_SIZE = 30;

export async function GET(request: Request, { params }: { params: { conversationId: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: params.conversationId } });
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (conversation.userAId !== user.id && conversation.userBId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (conversation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Chat expired" }, { status: 410 });
  }

  const cursor = new URL(request.url).searchParams.get("cursor");
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1
        }
      : {})
  });

  const nextCursor = messages.length === PAGE_SIZE ? messages[messages.length - 1]?.id ?? null : null;

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      userAId: conversation.userAId,
      userBId: conversation.userBId,
      expiresAt: conversation.expiresAt
    },
    messages: [...messages].reverse(),
    nextCursor
  });
}

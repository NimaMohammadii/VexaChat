import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { getSignedMediaReadUrl } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: { conversationId: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversation = await prisma.conversation.findUnique({ where: { id: params.conversationId } });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conversation.userAId !== user.id && conversation.userBId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const media = await prisma.chatMedia.findMany({
    where: { conversationId: conversation.id, expiresAt: { gt: now } },
    orderBy: { createdAt: "asc" },
    select: { id: true, messageId: true, senderId: true, type: true, storageKey: true, expiresAt: true, createdAt: true }
  });

  const payload = await Promise.all(
    media.map(async (item) => ({ ...item, url: await getSignedMediaReadUrl({ key: item.storageKey }) }))
  );

  return NextResponse.json({ media: payload });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { userId?: string };
  const targetUserId = body.userId?.trim();

  if (!targetUserId || targetUserId === user.id) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }

  await prisma.userBlock.upsert({
    where: {
      blockerId_blockedId: {
        blockerId: user.id,
        blockedId: targetUserId
      }
    },
    update: {},
    create: {
      blockerId: user.id,
      blockedId: targetUserId
    }
  });

  const relatedRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: user.id }
      ]
    },
    select: { id: true }
  });

  await prisma.friendRequest.deleteMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: user.id }
      ]
    }
  });

  if (relatedRequests.length) {
    await prisma.notification.deleteMany({
      where: {
        type: "friend_request",
        entityId: { in: relatedRequests.map((item) => item.id) }
      }
    });
  }

  return NextResponse.json({ ok: true });
}

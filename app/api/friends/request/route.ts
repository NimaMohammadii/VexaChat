import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

const RE_REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { receiverId?: string };
  const receiverId = body.receiverId?.trim();

  if (!receiverId || receiverId === user.id) {
    return NextResponse.json({ error: "Invalid receiver." }, { status: 400 });
  }

  const [blockA, blockB] = await Promise.all([
    prisma.userBlock.findUnique({ where: { blockerId_blockedId: { blockerId: user.id, blockedId: receiverId } } }),
    prisma.userBlock.findUnique({ where: { blockerId_blockedId: { blockerId: receiverId, blockedId: user.id } } })
  ]);

  if (blockA || blockB) {
    return NextResponse.json({ error: "Cannot request this user." }, { status: 403 });
  }

  const existingBothDirections = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { senderId: user.id, receiverId },
        { senderId: receiverId, receiverId: user.id }
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  const acceptedRequest = existingBothDirections.find((item) => item.status === "accepted");
  if (acceptedRequest) {
    return NextResponse.json({ status: "accepted" });
  }

  const pendingRequest = existingBothDirections.find((item) => item.status === "pending");
  if (pendingRequest) {
    return NextResponse.json({ status: "pending" });
  }

  const sameDirection = existingBothDirections.find((item) => item.senderId === user.id && item.receiverId === receiverId);

  if (sameDirection && sameDirection.status === "rejected") {
    const elapsed = Date.now() - sameDirection.updatedAt.getTime();
    if (elapsed < RE_REQUEST_COOLDOWN_MS) {
      return NextResponse.json({ error: "Please wait 24h before sending another request." }, { status: 429 });
    }

    const updated = await prisma.friendRequest.update({
      where: { senderId_receiverId: { senderId: user.id, receiverId } },
      data: { status: "pending" }
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "friend_request",
        entityId: updated.id
      }
    });

    return NextResponse.json({ request: updated });
  }

  const created = await prisma.friendRequest.create({
    data: {
      senderId: user.id,
      receiverId,
      status: "pending"
    }
  });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "friend_request",
      entityId: created.id
    }
  });

  return NextResponse.json({ request: created });
}

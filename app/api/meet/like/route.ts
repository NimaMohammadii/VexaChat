import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { toUserId?: string };
  const toUserId = body.toUserId?.trim();

  if (!toUserId || toUserId === user.id) {
    return NextResponse.json({ error: "Invalid target user." }, { status: 400 });
  }

  const [myCard, targetCard, blockA, blockB] = await Promise.all([
    prisma.meetCard.findUnique({ where: { userId: user.id } }),
    prisma.meetCard.findUnique({ where: { userId: toUserId } }),
    prisma.meetBlock.findUnique({ where: { blockerUserId_blockedUserId: { blockerUserId: user.id, blockedUserId: toUserId } } }),
    prisma.meetBlock.findUnique({ where: { blockerUserId_blockedUserId: { blockerUserId: toUserId, blockedUserId: user.id } } })
  ]);

  if (!myCard || !targetCard) {
    return NextResponse.json({ error: "Both users must have active Meet cards." }, { status: 400 });
  }

  if (blockA || blockB) {
    return NextResponse.json({ error: "Cannot request this user." }, { status: 403 });
  }

  try {
    const requestRecord = await prisma.meetLikeRequest.upsert({
      where: { fromUserId_toUserId: { fromUserId: user.id, toUserId } },
      update: { status: "pending" },
      create: { fromUserId: user.id, toUserId, status: "pending" }
    });

    await prisma.meetNotification.create({
      data: {
        userId: toUserId,
        type: "meet_like_request",
        data: { requestId: requestRecord.id, fromUserId: user.id }
      }
    });

    return NextResponse.json({ ok: true, requestId: requestRecord.id, status: requestRecord.status });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Request already exists." }, { status: 409 });
    }

    console.error("Failed to create like request", error);
    return NextResponse.json({ error: "Unable to create request." }, { status: 500 });
  }
}

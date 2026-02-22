import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { blockedUserId?: string };
  const blockedUserId = body.blockedUserId?.trim();

  if (!blockedUserId || blockedUserId === user.id) {
    return NextResponse.json({ error: "Invalid blocked user." }, { status: 400 });
  }

  try {
    await prisma.meetBlock.create({ data: { blockerUserId: user.id, blockedUserId } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      console.error("Failed to block user", error);
      return NextResponse.json({ error: "Unable to block user." }, { status: 500 });
    }
  }

  await prisma.meetLikeRequest.updateMany({
    where: {
      OR: [
        { fromUserId: user.id, toUserId: blockedUserId, status: "pending" },
        { fromUserId: blockedUserId, toUserId: user.id, status: "pending" }
      ]
    },
    data: { status: "canceled" }
  });

  return NextResponse.json({ ok: true });
}

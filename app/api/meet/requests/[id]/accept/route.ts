import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderedUserPair } from "@/lib/meet";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestRecord = await prisma.meetLikeRequest.findUnique({ where: { id: params.id } });

  if (!requestRecord) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (requestRecord.toUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (requestRecord.status !== "pending") {
    return NextResponse.json({ error: "Request is not pending." }, { status: 409 });
  }

  const pair = orderedUserPair(requestRecord.fromUserId, requestRecord.toUserId);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.meetLikeRequest.update({ where: { id: requestRecord.id }, data: { status: "accepted" } });
    const match = await tx.meetMatch.upsert({
      where: { userLowId_userHighId: pair },
      update: {},
      create: pair
    });

    await tx.meetNotification.createMany({
      data: [
        { userId: requestRecord.fromUserId, type: "meet_request_accepted", data: { requestId: requestRecord.id, byUserId: user.id, matchId: match.id } },
        { userId: requestRecord.toUserId, type: "meet_match_created", data: { requestId: requestRecord.id, withUserId: requestRecord.fromUserId, matchId: match.id } }
      ]
    });

    return { updated, match };
  });

  return NextResponse.json({ ok: true, request: result.updated, match: result.match });
}

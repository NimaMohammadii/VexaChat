import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

  const updated = await prisma.meetLikeRequest.update({ where: { id: requestRecord.id }, data: { status: "rejected" } });

  await prisma.meetNotification.create({
    data: { userId: requestRecord.fromUserId, type: "meet_request_rejected", data: { requestId: requestRecord.id, byUserId: user.id } }
  });

  return NextResponse.json({ ok: true, request: updated });
}

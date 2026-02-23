import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(_: Request, context: { params: { id: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestRecord = await prisma.friendRequest.findUnique({ where: { id: context.params.id } });

  if (!requestRecord) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (requestRecord.receiverId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.friendRequest.update({
    where: { id: requestRecord.id },
    data: { status: "accepted" }
  });

  await prisma.notification.updateMany({
    where: {
      type: "friend_request",
      entityId: requestRecord.id,
      userId: user.id
    },
    data: { isRead: true }
  });

  return NextResponse.json({ ok: true });
}

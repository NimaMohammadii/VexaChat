import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { userId?: string };
  const friendUserId = body.userId?.trim();

  if (!friendUserId || friendUserId === user.id) {
    return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  }

  await prisma.friendRequest.deleteMany({
    where: {
      status: "accepted",
      OR: [
        { senderId: user.id, receiverId: friendUserId },
        { senderId: friendUserId, receiverId: user.id }
      ]
    }
  });

  return NextResponse.json({ ok: true });
}

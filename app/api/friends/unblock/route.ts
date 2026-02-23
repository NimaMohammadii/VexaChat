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

  await prisma.userBlock.deleteMany({
    where: {
      blockerId: user.id,
      blockedId: targetUserId
    }
  });

  return NextResponse.json({ ok: true });
}

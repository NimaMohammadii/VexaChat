import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function DELETE(_: Request, { params }: { params: { toUserId: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.meetFollow.deleteMany({ where: { fromUserId: user.id, toUserId: params.toUserId } });
  return NextResponse.json({ ok: true });
}

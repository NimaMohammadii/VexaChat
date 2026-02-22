import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { blockedUserId?: string };
  if (!body.blockedUserId || body.blockedUserId === user.id) {
    return NextResponse.json({ error: "Invalid blockedUserId." }, { status: 400 });
  }

  try {
    await prisma.meetBlock.create({ data: { blockerUserId: user.id, blockedUserId: body.blockedUserId } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      return NextResponse.json({ error: "Could not block user." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

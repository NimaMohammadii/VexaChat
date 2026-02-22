import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceActionRateLimit } from "@/lib/meet";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await enforceActionRateLimit(user.id, "swipe"))) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 60 likes/passes per minute." }, { status: 429 });
  }

  const body = (await request.json()) as { toUserId?: string };
  if (!body.toUserId || body.toUserId === user.id) {
    return NextResponse.json({ error: "Invalid toUserId." }, { status: 400 });
  }

  try {
    await prisma.meetLike.create({ data: { fromUserId: user.id, toUserId: body.toUserId } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      return NextResponse.json({ error: "Could not like user." }, { status: 500 });
    }
  }

  const reciprocal = await prisma.meetLike.findUnique({ where: { fromUserId_toUserId: { fromUserId: body.toUserId, toUserId: user.id } } });
  return NextResponse.json({ ok: true, matched: Boolean(reciprocal) });
}

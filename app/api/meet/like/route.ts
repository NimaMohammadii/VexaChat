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

  try {
    await prisma.meetLike.create({ data: { fromUserId: user.id, toUserId } });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
      console.error("Failed to like meet card", error);
      return NextResponse.json({ error: "Unable to save like." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

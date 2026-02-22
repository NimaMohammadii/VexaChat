import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      profile: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ favorites });
}


export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { profileId?: string };
  const profileId = body.profileId?.trim();

  if (!profileId) {
    return NextResponse.json({ error: "profileId is required." }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { id: true, verified: true } });
  if (!profile || !profile.verified) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const favorite = await prisma.favorite.upsert({
    where: { userId_profileId: { userId: user.id, profileId } },
    update: {},
    create: { userId: user.id, profileId }
  });

  return NextResponse.json({ favorite }, { status: 201 });
}

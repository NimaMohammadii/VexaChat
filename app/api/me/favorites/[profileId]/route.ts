import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function DELETE(_: Request, { params }: { params: { profileId: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: user.id,
      profileId: params.profileId
    }
  });

  return NextResponse.json({ success: true });
}

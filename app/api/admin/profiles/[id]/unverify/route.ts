import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();

  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await prisma.profile.update({
    where: { id: params.id },
    data: { verified: false }
  });

  return NextResponse.json({ profile });
}

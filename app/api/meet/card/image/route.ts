import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { deleteObjectByKey, isLegacyUrl } from "@/lib/storage/object-storage";

export async function DELETE() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.meetCard.findUnique({ where: { userId: user.id } });
  if (!existing) {
    return NextResponse.json({ error: "Meet card not found." }, { status: 404 });
  }

  if (existing.imageUrl && !isLegacyUrl(existing.imageUrl)) {
    await deleteObjectByKey(existing.imageUrl);
  }

  const card = await prisma.meetCard.update({
    where: { userId: user.id },
    data: { imageUrl: "" }
  });

  return NextResponse.json({ card });
}

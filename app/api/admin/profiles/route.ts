import { NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profiles = await prisma.profile.findMany({
    orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      city: true,
      price: true,
      verified: true,
      ownerUserId: true,
      imageUrl: true,
      images: true,
      createdAt: true
    }
  });

  return NextResponse.json({ profiles });
}

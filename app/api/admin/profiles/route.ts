import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user || !isAdminUser(user)) {
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

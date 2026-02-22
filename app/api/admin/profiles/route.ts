import { NextRequest, NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = request.nextUrl.searchParams.get("email")?.trim();
  const verified = request.nextUrl.searchParams.get("verified")?.trim();

  const profiles = await prisma.profile.findMany({
    where: {
      verified: verified === "verified" ? true : verified === "pending" ? false : undefined,
      ownerUserId: email
        ? {
          in: (
            await prisma.userProfile.findMany({
              where: { username: { contains: email, mode: "insensitive" } },
              select: { userId: true }
            })
          ).map((item) => item.userId)
        }
        : undefined
    },
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
      createdAt: true,
      rejectionNote: true
    }
  });

  return NextResponse.json({ profiles });
}

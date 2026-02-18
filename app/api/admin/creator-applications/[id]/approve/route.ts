import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!isAdminTokenValid(cookieValue)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await prisma.creatorProfile.findUnique({ where: { id: params.id } });
  if (!creator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.creatorProfile.update({ where: { id: params.id }, data: { approved: true } }),
    prisma.user.update({ where: { id: creator.userId }, data: { role: "CREATOR", kycStatus: "APPROVED" } })
  ]);

  return NextResponse.redirect(new URL("/admin", request.url));
}

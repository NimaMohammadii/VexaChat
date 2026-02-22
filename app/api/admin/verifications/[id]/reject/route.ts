import { NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type RejectionPayload = {
  note?: string;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as RejectionPayload;
  const note = body.note?.trim() || "";

  if (!note) {
    return NextResponse.json({ error: "Rejection note is required." }, { status: 400 });
  }

  const existing = await prisma.verificationRequest.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Verification request not found." }, { status: 404 });
  }

  const [updated] = await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: params.id },
      data: {
        status: "rejected",
        note,
        adminNote: note
      }
    }),
    prisma.userProfile.updateMany({
      where: { userId: existing.userId },
      data: {
        identityVerified: false,
        identityStatus: "rejected"
      }
    }),
    prisma.profile.updateMany({ where: { ownerUserId: existing.userId }, data: { rejectionNote: note, verified: false } })
  ]);

  return NextResponse.json({ request: updated });
}

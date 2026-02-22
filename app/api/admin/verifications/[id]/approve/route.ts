import { NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type ApprovalPayload = {
  note?: string;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as ApprovalPayload;
  const note = body.note?.trim() || null;

  const existing = await prisma.verificationRequest.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Verification request not found." }, { status: 404 });
  }

  const [updated] = await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: params.id },
      data: {
        status: "approved",
        note,
        adminNote: note
      }
    }),
    prisma.userProfile.updateMany({
      where: { userId: existing.userId },
      data: {
        identityVerified: true,
        identityStatus: "approved"
      }
    }),
    prisma.profile.updateMany({ where: { ownerUserId: existing.userId }, data: { verified: true, rejectionNote: null } })
  ]);

  return NextResponse.json({ request: updated });
}

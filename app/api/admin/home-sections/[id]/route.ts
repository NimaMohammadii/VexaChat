import { NextRequest, NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    order?: number;
    isActive?: boolean;
  };

  const updated = await prisma.homeSection.update({
    where: { id: params.id },
    data: {
      title: body.title !== undefined ? String(body.title).trim() : undefined,
      subtitle: body.subtitle !== undefined ? String(body.subtitle).trim() || null : undefined,
      imageUrl: body.imageUrl !== undefined ? String(body.imageUrl).trim() : undefined,
      order: body.order !== undefined ? Number(body.order) : undefined,
      isActive: body.isActive
    }
  });

  return NextResponse.json({ section: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.homeSection.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}

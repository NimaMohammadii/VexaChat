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

  // Prisma update does NOT accept null for non-nullable string fields.
  // Normalize null/empty-string to undefined (means: "do not update this field")
  const normStr = (value: unknown) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value !== "string") return undefined;

    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  };

  const updated = await prisma.homeSection.update({
    where: { id: params.id },
    data: {
      title: normStr(body.title),
      subtitle: normStr(body.subtitle),
      imageUrl: normStr(body.imageUrl),
      order: typeof body.order === "number" ? body.order : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined
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

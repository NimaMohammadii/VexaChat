import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

function parseOptionalString(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      subtitle?: string;
      imageUrl?: string;
      order?: number;
      isActive?: boolean;
    };

    const titlePatch = parseOptionalString(body.title);
    const imagePatch = parseOptionalString(body.imageUrl);

    if (body.title !== undefined && !titlePatch) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    }

    if (body.imageUrl !== undefined && !imagePatch) {
      return NextResponse.json({ error: "imageUrl cannot be empty" }, { status: 400 });
    }

    const updated = await prisma.homeSection.update({
      where: { id: params.id },
      data: {
        title: titlePatch,
        subtitle: body.subtitle === "" ? null : parseOptionalString(body.subtitle),
        imageUrl: imagePatch,
        order: typeof body.order === "number" && Number.isFinite(body.order) ? body.order : undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined
      }
    });

    return NextResponse.json({ section: { ...updated, imageUrl: await resolveStoredFileUrl(updated.imageUrl) } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    console.error("[admin/home-sections/:id][PATCH]", error);
    return NextResponse.json({ error: "Unable to update section" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.homeSection.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    console.error("[admin/home-sections/:id][DELETE]", error);
    return NextResponse.json({ error: "Unable to delete section" }, { status: 500 });
  }
}

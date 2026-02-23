import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { deleteStoredMedia } from "@/lib/media-storage";
import { prisma } from "@/lib/prisma";

function parseOptionalString(value: unknown) {
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
      key?: string;
      title?: string;
      subtitle?: string;
      imageUrl?: string;
      ctaText?: string;
      ctaHref?: string;
      order?: number;
      isActive?: boolean;
    };

    const existing = await prisma.homeSection.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

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
        key: parseOptionalString(body.key),
        title: titlePatch,
        subtitle: body.subtitle === "" ? null : parseOptionalString(body.subtitle),
        imageUrl: imagePatch,
        ctaText: body.ctaText === "" ? null : parseOptionalString(body.ctaText),
        ctaHref: body.ctaHref === "" ? null : parseOptionalString(body.ctaHref),
        order: typeof body.order === "number" && Number.isFinite(body.order) ? body.order : undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined
      }
    });

    if (imagePatch && existing.imageUrl !== imagePatch) {
      await deleteStoredMedia(existing.imageUrl);
    }

    return NextResponse.json({ section: updated });
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
    const existing = await prisma.homeSection.findUnique({ where: { id: params.id } });

    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    await prisma.homeSection.delete({ where: { id: params.id } });
    await deleteStoredMedia(existing.imageUrl);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    console.error("[admin/home-sections/:id][DELETE]", error);
    return NextResponse.json({ error: "Unable to delete section" }, { status: 500 });
  }
}

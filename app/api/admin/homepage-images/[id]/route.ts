import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { uploadHomepageImage } from "@/lib/homepage-image-storage";
import { prisma } from "@/lib/prisma";
import { deleteObjectByKey, resolveStoredFileUrl } from "@/lib/storage/object-storage";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const hasAdminAccess = await isAdminAccessAllowed();
  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    const existing = await prisma.homepageImage.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }

      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
      }

      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "File must be 5MB or smaller" }, { status: 400 });
      }

      const uploaded = await uploadHomepageImage(file);
      const updated = await prisma.homepageImage.update({
        where: { id: params.id },
        data: {
          url: "",
          storagePath: uploaded.storagePath,
          contentType: uploaded.contentType,
          data: null
        }
      });

      if (existing.storagePath && existing.storagePath !== updated.storagePath) {
        await deleteObjectByKey(existing.storagePath).catch(() => null);
      }

      return NextResponse.json({ image: { ...updated, url: await resolveStoredFileUrl(updated.storagePath) } });
    }

    const body = (await request.json()) as { order?: number };
    if (typeof body.order !== "number" || !Number.isFinite(body.order)) {
      return NextResponse.json({ error: "order must be a number" }, { status: 400 });
    }

    const updated = await prisma.homepageImage.update({
      where: { id: params.id },
      data: { order: body.order }
    });

    return NextResponse.json({ image: { ...updated, url: updated.storagePath ? await resolveStoredFileUrl(updated.storagePath) : "" } });
  } catch (error) {
    console.error("[admin/homepage-images/:id][PATCH]", error);
    return NextResponse.json({ error: "Unable to update homepage image" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const hasAdminAccess = await isAdminAccessAllowed();
  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const existing = await prisma.homepageImage.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    await prisma.homepageImage.delete({ where: { id: params.id } });
    if (existing.storagePath) {
      await deleteObjectByKey(existing.storagePath).catch(() => null);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    console.error("[admin/homepage-images/:id][DELETE]", error);
    return NextResponse.json({ error: "Unable to delete homepage image" }, { status: 500 });
  }
}

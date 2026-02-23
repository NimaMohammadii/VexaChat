import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { uploadHomepageImage } from "@/lib/homepage-image-storage";
import { prisma } from "@/lib/prisma";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function logPrismaError(context: string, err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`${context} Prisma error`, {
      code: err.code,
      message: err.message,
      meta: err.meta
    });
    return;
  }

  console.error(context, err);
}

export async function GET() {
  const hasAdminAccess = await isAdminAccessAllowed();
  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const images = await prisma.homepageImage.findMany({
      where: { slot: "homepage" },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }]
    });

    return NextResponse.json({ images });
  } catch (error) {
    logPrismaError("[admin/homepage-images][GET] Prisma query failed", error);
    return NextResponse.json({ error: "Unable to load homepage images" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const hasAdminAccess = await isAdminAccessAllowed();
  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  try {
    const latest = await prisma.homepageImage.findFirst({
      where: { slot: "homepage" },
      orderBy: { order: "desc" },
      select: { order: true }
    });

    const { url, storagePath } = await uploadHomepageImage(file);

    const image = await prisma.homepageImage.create({
      data: {
        slot: "homepage",
        order: (latest?.order ?? -1) + 1,
        url,
        storagePath
      }
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error("[admin/homepage-images][POST]", error);
    return NextResponse.json({ error: "Unable to upload homepage image" }, { status: 500 });
  }
}

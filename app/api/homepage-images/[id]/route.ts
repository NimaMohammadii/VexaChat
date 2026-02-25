import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const image = await prisma.homepageImage.findUnique({
    where: { id: params.id },
    select: { storagePath: true }
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (!image.storagePath) {
    return NextResponse.json({ error: "Image data is missing" }, { status: 404 });
  }

  const signedUrl = await resolveStoredFileUrl(image.storagePath);
  return NextResponse.redirect(signedUrl);
}

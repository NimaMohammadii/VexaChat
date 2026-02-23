import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const image = await prisma.homepageImage.findUnique({
    where: { id: params.id },
    select: { data: true, contentType: true, url: true }
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (image.data) {
    return new NextResponse(image.data, {
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  }

  if (image.url?.trim()) {
    return NextResponse.redirect(image.url);
  }

  return NextResponse.json({ error: "Image data is missing" }, { status: 404 });
}

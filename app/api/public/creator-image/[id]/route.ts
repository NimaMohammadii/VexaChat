import { prisma } from "@/lib/prisma";
import { getPrivateFileAbsolutePath } from "@/lib/kyc-storage";
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import path from "node:path";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const creator = await prisma.creatorProfile.findUnique({ where: { id: params.id } });

  if (!creator?.approved) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absolutePath = getPrivateFileAbsolutePath(creator.profileImageUrl);

  try {
    const file = await readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300"
      }
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

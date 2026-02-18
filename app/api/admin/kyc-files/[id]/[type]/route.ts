import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";
import { getPrivateFileAbsolutePath } from "@/lib/kyc-storage";
import { readFile } from "node:fs/promises";
import path from "node:path";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

export async function GET(request: NextRequest, { params }: { params: { id: string; type: string } }) {
  const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!isAdminTokenValid(cookieValue)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await prisma.creatorProfile.findUnique({ where: { id: params.id } });
  if (!creator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const relativePath = params.type === "id-card" ? creator.idCardUrl : params.type === "selfie" ? creator.selfieWithIdUrl : null;
  if (!relativePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const absolutePath = getPrivateFileAbsolutePath(relativePath);

  try {
    const file = await readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    return new NextResponse(file, {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

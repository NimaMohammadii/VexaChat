import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: NextRequest) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WebP are allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File must be 5MB or smaller" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = extensionFromType(file.type);
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const relativeDir = path.join("uploads", "home");
  const publicDir = path.join(process.cwd(), "public", relativeDir);

  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, fileName), bytes);

  return NextResponse.json({ url: `/${relativeDir}/${fileName}` });
}

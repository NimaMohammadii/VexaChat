import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getR2EnvPresence } from "@/lib/r2/client";
import { getSignedUploadUrl } from "@/lib/storage/object-storage";
import { isAdminAccessAllowed } from "@/lib/admin-access";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "image/avif") return "avif";
  return "jpg";
}

export async function POST(request: NextRequest) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const envPresence = getR2EnvPresence();
  if (Object.values(envPresence).some((present) => !present)) {
    return NextResponse.json({ error: "Storage is not configured" }, { status: 500 });
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

  const extension = extensionFromType(file.type);
  const key = `homepage/sections/${Date.now()}-${randomUUID()}.${extension}`;

  try {
    const uploadUrl = await getSignedUploadUrl(key, file.type, 10 * 60);
    return NextResponse.json({ key, uploadUrl });
  } catch (error) {
    console.error("[admin/upload][POST]", error);
    return NextResponse.json({ error: "Unable to prepare upload" }, { status: 500 });
  }
}

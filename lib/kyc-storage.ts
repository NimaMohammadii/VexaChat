import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const PRIVATE_UPLOAD_ROOT = path.join(process.cwd(), "storage", "private");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type KycFileType = "profile" | "id-card" | "selfie-with-id";

function extensionForMime(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export async function saveKycFile(file: File, userId: string, fileType: KycFileType) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Each image must be 5MB or smaller.");
  }

  const userDir = path.join(PRIVATE_UPLOAD_ROOT, userId);
  await mkdir(userDir, { recursive: true });

  const ext = extensionForMime(file.type);
  const filename = `${fileType}-${randomUUID()}.${ext}`;
  const absolutePath = path.join(userDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  return `${userId}/${filename}`;
}

export function getPrivateFileAbsolutePath(relativePath: string) {
  return path.join(PRIVATE_UPLOAD_ROOT, relativePath);
}

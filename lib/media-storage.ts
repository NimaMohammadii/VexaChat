import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const HOME_UPLOAD_DIR = path.join("uploads", "home");

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "image/avif") return "avif";
  return "jpg";
}

export function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File must be 5MB or smaller");
  }
}

export async function saveHomeImageFile(file: File) {
  validateImageFile(file);

  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = extensionFromType(file.type);
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const publicDir = path.join(process.cwd(), "public", HOME_UPLOAD_DIR);

  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, fileName), bytes);

  const relativePath = `/${HOME_UPLOAD_DIR}/${fileName}`;
  return { url: relativePath, path: relativePath };
}

function pathFromUrl(urlOrPath: string) {
  if (!urlOrPath) return null;

  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    return null;
  }

  const normalized = urlOrPath.startsWith("/") ? urlOrPath.slice(1) : urlOrPath;

  if (!normalized.startsWith(`${HOME_UPLOAD_DIR}/`)) {
    return null;
  }

  return path.join(process.cwd(), "public", normalized);
}

export async function deleteStoredMedia(urlOrPath: string | null | undefined) {
  if (!urlOrPath) return false;

  const localPath = pathFromUrl(urlOrPath);
  if (!localPath) return false;

  try {
    await unlink(localPath);
    return true;
  } catch {
    return false;
  }
}

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const HOMEPAGE_IMAGE_BUCKET = "profile-images";
const HOMEPAGE_IMAGE_PREFIX = "homepage";
const LOCAL_UPLOAD_DIR = path.join("uploads", "homepage");
const LOCAL_STORAGE_PREFIX = "local:";

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "image/avif") return "avif";
  return "jpg";
}

function hasSupabaseStorageConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function uploadHomepageImageLocally(file: File) {
  const extension = extensionFromType(file.type);
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const publicDir = path.join(process.cwd(), "public", LOCAL_UPLOAD_DIR);

  await mkdir(publicDir, { recursive: true });
  await writeFile(path.join(publicDir, fileName), bytes);

  return {
    url: `/${LOCAL_UPLOAD_DIR}/${fileName}`,
    storagePath: `${LOCAL_STORAGE_PREFIX}${path.posix.join(LOCAL_UPLOAD_DIR, fileName)}`
  };
}

export async function uploadHomepageImage(file: File) {
  if (!hasSupabaseStorageConfig()) {
    return uploadHomepageImageLocally(file);
  }

  const supabase = createSupabaseServerClient({ canSetCookies: false });
  const extension = extensionFromType(file.type);
  const storagePath = `${HOMEPAGE_IMAGE_PREFIX}/${Date.now()}-${randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(HOMEPAGE_IMAGE_BUCKET).upload(storagePath, file, {
    upsert: false,
    contentType: file.type
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(HOMEPAGE_IMAGE_BUCKET).getPublicUrl(storagePath);
  return { url: data.publicUrl, storagePath };
}

async function deleteLocalHomepageImage(storagePath: string) {
  const relativePath = storagePath.slice(LOCAL_STORAGE_PREFIX.length);
  if (!relativePath.trim()) {
    return;
  }

  try {
    await unlink(path.join(process.cwd(), "public", relativePath));
  } catch {
    // Ignore missing files to keep delete idempotent.
  }
}

export async function deleteHomepageImage(storagePath: string) {
  const trimmedStoragePath = storagePath.trim();
  if (!trimmedStoragePath) {
    return;
  }

  if (trimmedStoragePath.startsWith(LOCAL_STORAGE_PREFIX)) {
    await deleteLocalHomepageImage(trimmedStoragePath);
    return;
  }

  if (!hasSupabaseStorageConfig()) {
    return;
  }

  const supabase = createSupabaseServerClient({ canSetCookies: false });
  await supabase.storage.from(HOMEPAGE_IMAGE_BUCKET).remove([trimmedStoragePath]);
}

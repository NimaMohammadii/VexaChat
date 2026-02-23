import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const HOMEPAGE_IMAGE_BUCKET = "profile-images";
const HOMEPAGE_IMAGE_PREFIX = "homepage";

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  if (type === "image/avif") return "avif";
  return "jpg";
}

export async function uploadHomepageImage(file: File) {
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

export async function deleteHomepageImage(storagePath: string) {
  const trimmedStoragePath = storagePath.trim();
  if (!trimmedStoragePath) {
    return;
  }

  const supabase = createSupabaseServerClient({ canSetCookies: false });
  await supabase.storage.from(HOMEPAGE_IMAGE_BUCKET).remove([trimmedStoragePath]);
}

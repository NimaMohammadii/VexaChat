import type { SupabaseClient } from "@supabase/supabase-js";

export const PROFILE_IMAGES_BUCKET = "profile-images";

export function createProfileImagePath(userId: string, fileName: string) {
  const extension = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase()
    : "";
  const safeExtension = extension && extension.length <= 10 ? extension : "jpg";

  return `${userId}-${Date.now()}.${safeExtension}`;
}

export function getStoragePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${PROFILE_IMAGES_BUCKET}/`;
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return url.slice(markerIndex + marker.length);
}

export async function uploadProfileImage(params: {
  supabase: SupabaseClient;
  userId: string;
  file: File;
  previousPublicUrl?: string;
}) {
  const { supabase, userId, file, previousPublicUrl } = params;

  const nextPath = createProfileImagePath(userId, file.name);

  if (previousPublicUrl) {
    const previousPath = getStoragePathFromPublicUrl(previousPublicUrl);

    if (previousPath) {
      await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([previousPath]);
    }
  }

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(nextPath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .getPublicUrl(nextPath);

  return {
    filePath: nextPath,
    publicUrl: data.publicUrl,
  };
}

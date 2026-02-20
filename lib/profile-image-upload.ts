import { SupabaseClient } from "@supabase/supabase-js";

const PROFILE_IMAGES_BUCKET = "profile-images";

function getFileExtension(file: File) {
  const nameParts = file.name.split(".");
  const extension = nameParts.length > 1 ? nameParts.pop() : null;

  if (extension) {
    return extension.toLowerCase();
  }

  const mimeExtension = file.type.split("/")[1];
  return mimeExtension?.toLowerCase() || "jpg";
}

function buildProfileImagePath(userId: string, file: File) {
  const extension = getFileExtension(file);
  return `${userId}-${Date.now()}.${extension}`;
}

export async function uploadProfileImage(params: {
  supabase: SupabaseClient;
  file: File;
  userId: string;
  previousImageUrl?: string | null;
}) {
  const { supabase, file, userId, previousImageUrl } = params;
  const filePath = buildProfileImagePath(userId, file);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image.");
  }

  const { data: publicUrlData } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(filePath);
  const publicUrl = publicUrlData.publicUrl;

  if (!publicUrl) {
    throw new Error("Unable to generate public URL for uploaded image.");
  }

  const { error: profileUpdateError } = await supabase
    .from("listings")
    .update({ image_url: publicUrl })
    .eq("id", userId);

  if (profileUpdateError) {
    if (uploadData?.path) {
      await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([uploadData.path]);
    }

    throw new Error(profileUpdateError.message || "Image uploaded but profile update failed.");
  }

  if (previousImageUrl) {
    const previousPath = getStoragePathFromPublicUrl(previousImageUrl);

    if (previousPath && previousPath !== filePath) {
      await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([previousPath]);
    }
  }

  return publicUrl;
}

export function getStoragePathFromPublicUrl(publicUrl: string) {
  const marker = `/storage/v1/object/public/${PROFILE_IMAGES_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return publicUrl.slice(markerIndex + marker.length);
}

export const profileImagesBucket = PROFILE_IMAGES_BUCKET;

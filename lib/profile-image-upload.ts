import { SupabaseClient } from "@supabase/supabase-js";

const PROFILE_IMAGES_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "profile-images";

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
  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
}

export async function uploadProfileImage(params: {
  supabase: SupabaseClient;
  file: File;
  userId: string;
}) {
  const { supabase, file, userId } = params;
  const filePath = buildProfileImagePath(userId, file);

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image.");
  }

  const { data: publicUrlData } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(filePath);
  const publicUrl = publicUrlData.publicUrl;

  if (!publicUrl) {
    throw new Error("Unable to generate public URL for uploaded image.");
  }

  return publicUrl;
}

export const profileImagesBucket = PROFILE_IMAGES_BUCKET;

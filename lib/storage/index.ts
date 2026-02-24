import { createClient } from "@supabase/supabase-js";

const BUCKET = "chat-media";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

type UploadChatMediaInput = {
  file?: File;
  fileBuffer?: Buffer;
  key: string;
  contentType: string;
};

export async function uploadChatMedia({ file, fileBuffer, key, contentType }: UploadChatMediaInput) {
  const supabase = getSupabaseAdminClient();
  const payload = fileBuffer ?? (file ? Buffer.from(await file.arrayBuffer()) : null);

  if (!payload) {
    throw new Error("No media payload provided for upload");
  }

  const { error } = await supabase.storage.from(BUCKET).upload(key, payload, {
    contentType,
    upsert: false
  });

  if (error) {
    throw new Error(`Failed to upload media: ${error.message}`);
  }

  return {
    key,
    publicUrl: await getPublicUrl({ key })
  };
}

export async function deleteChatMedia({ key }: { key: string }) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(BUCKET).remove([key]);

  if (error) {
    throw new Error(`Failed to delete media: ${error.message}`);
  }
}

export async function getPublicUrl({ key }: { key: string }) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(key, 60 * 60);
  if (error || !data?.signedUrl) {
    throw new Error(`Failed to sign media URL: ${error?.message ?? "unknown error"}`);
  }
  return data.signedUrl;
}

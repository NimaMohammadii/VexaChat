import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { Profile } from "@/lib/types";

const LISTING_COLUMNS = "id,user_id,name,city,description,image_url,is_published,created_at";

type ListingRow = {
  id: string;
  user_id: string | null;
  name: string;
  city: string;
  description: string;
  image_url: string | null;
  is_published: boolean | null;
  created_at: string;
};

function toProfile(row: ListingRow): Profile {
  return {
    id: row.id,
    name: row.name,
    age: 0,
    city: row.city,
    price: 0,
    description: row.description,
    images: row.image_url ? [row.image_url] : [],
    height: "",
    languages: [],
    availability: row.is_published ? "Available" : "Unavailable",
    verified: false,
    isTop: false,
    experienceYears: 0,
    rating: 0,
    services: [],
    createdAt: row.created_at
  };
}

function toListingPayload(data: Omit<Profile, "id" | "createdAt">) {
  return {
    name: data.name,
    city: data.city,
    description: data.description,
    image_url: data.images[0] ?? null,
    is_published: true
  };
}

export async function listProfiles() {
  const supabase = createSupabaseAdminClient() ?? createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toProfile(row as ListingRow));
}

export async function getProfileById(id: string) {
  const supabase = createSupabaseAdminClient() ?? createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toProfile(data as ListingRow) : null;
}

export async function createProfile(data: Omit<Profile, "id" | "createdAt">) {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { data: created, error } = await supabase
    .from("listings")
    .insert({
      ...toListingPayload(data),
      user_id: userId,
      is_published: true
    })
    .select(LISTING_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return toProfile(created as ListingRow);
}

export async function updateProfile(id: string, data: Omit<Profile, "id" | "createdAt">) {
  const supabase = createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { data: updated, error } = await supabase
    .from("listings")
    .update({
      ...toListingPayload(data),
      is_published: true
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select(LISTING_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return updated ? toProfile(updated as ListingRow) : null;
}

export async function deleteProfile(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("listings").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

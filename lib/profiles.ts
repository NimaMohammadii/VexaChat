import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { Profile } from "@/lib/types";

const LISTING_COLUMNS =
  "id,user_id,name,age,city,price,description,image_url,height,languages,availability,verified,is_top,experience_years,rating,services,is_published,created_at";

type ListingRow = {
  id: string;
  user_id: string | null;
  name: string;
  age: number;
  city: string;
  price: number;
  description: string;
  image_url: string | null;
  height: string;
  languages: string[];
  availability: string;
  verified: boolean;
  is_top: boolean;
  experience_years: number;
  rating: number;
  services: string[];
  is_published: boolean | null;
  created_at: string;
};

function toProfile(row: ListingRow): Profile {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    city: row.city,
    price: row.price,
    description: row.description,
    images: row.image_url ? [row.image_url] : [],
    height: row.height,
    languages: row.languages,
    availability: row.availability,
    verified: row.verified,
    isTop: row.is_top,
    experienceYears: row.experience_years,
    rating: Number(row.rating),
    services: row.services,
    createdAt: row.created_at
  };
}

function toListingPayload(data: Omit<Profile, "id" | "createdAt">) {
  return {
    name: data.name,
    age: data.age,
    city: data.city,
    price: data.price,
    description: data.description,
    image_url: data.images[0] ?? null,
    height: data.height,
    languages: data.languages,
    availability: data.availability,
    verified: data.verified,
    is_top: data.isTop,
    experience_years: data.experienceYears,
    rating: data.rating,
    services: data.services,
    is_published: data.availability.toLowerCase() === "available"
  };
}

export async function listProfiles() {
  const supabase = createSupabaseAdminClient() ?? createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
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
      user_id: userId
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
    .update(toListingPayload(data))
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

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { Profile } from "@/lib/types";

const PROFILE_COLUMNS =
  "id,name,age,city,price,description,images,height,languages,availability,verified,isTop,experienceYears,rating,services,createdAt";

type ProfileRow = {
  id: string;
  name: string;
  age: number;
  city: string;
  price: number;
  description: string;
  images: string[] | null;
  height: string | null;
  languages: string[] | null;
  availability: string | null;
  verified: boolean | null;
  isTop: boolean | null;
  experienceYears: number | null;
  rating: number | null;
  services: string[] | null;
  createdAt: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    city: row.city,
    price: row.price,
    description: row.description,
    images: row.images ?? [],
    height: row.height ?? "",
    languages: row.languages ?? [],
    availability: row.availability ?? "Unavailable",
    verified: row.verified ?? false,
    isTop: row.isTop ?? false,
    experienceYears: row.experienceYears ?? 0,
    rating: row.rating ?? 0,
    services: row.services ?? [],
    createdAt: row.createdAt
  };
}

export async function listProfiles() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("createdAt", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toProfile(row as ProfileRow));
}

export async function getProfileById(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toProfile(data as ProfileRow) : null;
}

export async function createProfile(data: Omit<Profile, "id" | "createdAt">) {
  const supabase = createSupabaseServerClient();
  const { data: created, error } = await supabase.from("profiles").insert(data).select(PROFILE_COLUMNS).single();

  if (error) {
    throw error;
  }

  return toProfile(created as ProfileRow);
}

export async function updateProfile(id: string, data: Omit<Profile, "id" | "createdAt">) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", id)
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return updated ? toProfile(updated as ProfileRow) : null;
}

export async function deleteProfile(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

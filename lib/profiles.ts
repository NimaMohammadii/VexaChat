import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { Profile } from "@/lib/types";

const PUBLIC_PROFILE_COLUMNS = "id,name,city,description,image_url,is_published,created_at";
const ADMIN_PROFILE_COLUMNS =
  "id,name,age,city,price,description,images,height,languages,availability,verified,isTop,experienceYears,rating,services,createdAt";

type PublicProfileRow = {
  id: string;
  name: string;
  city: string;
  description: string;
  image_url: string | null;
  is_published: boolean | null;
  created_at: string;
};

type AdminProfileRow = {
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

function toPublicProfile(row: PublicProfileRow): Profile {
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
    availability: "Available",
    verified: false,
    isTop: false,
    experienceYears: 0,
    rating: 0,
    services: [],
    createdAt: row.created_at
  };
}

function toAdminProfile(row: AdminProfileRow): Profile {
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
  const supabase = createSupabaseAdminClient() ?? createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toPublicProfile(row as PublicProfileRow));
}

export async function getProfileById(id: string) {
  const supabase = createSupabaseAdminClient() ?? createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toPublicProfile(data as PublicProfileRow) : null;
}

export async function createProfile(data: Omit<Profile, "id" | "createdAt">) {
  const supabase = createSupabaseServerClient();
  const { data: created, error } = await supabase.from("profiles").insert(data).select(ADMIN_PROFILE_COLUMNS).single();

  if (error) {
    throw error;
  }

  return toAdminProfile(created as AdminProfileRow);
}

export async function updateProfile(id: string, data: Omit<Profile, "id" | "createdAt">) {
  const supabase = createSupabaseServerClient();
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", id)
    .select(ADMIN_PROFILE_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return updated ? toAdminProfile(updated as AdminProfileRow) : null;
}

export async function deleteProfile(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

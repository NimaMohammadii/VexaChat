import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type UpdateProfilePayload = {
  name?: string;
  age?: number | string | null;
  city?: string;
  price?: number | string | null;
  description?: string;
  images?: string[] | null;
  height?: string;
  languages?: string[] | string | null;
  availability?: string;
  verified?: boolean;
  is_top?: boolean;
  experience_years?: number | string | null;
  rating?: number | string | null;
  services?: string[] | string | null;
};

const toIntOrNull = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const toNumOrNull = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toStringArray = (v: string[] | string | null | undefined) => {
  if (Array.isArray(v)) {
    return v;
  }

  if (typeof v === "string") {
    return v
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const adminCookieRaw = cookieStore.get(ADMIN_COOKIE)?.value;
  const adminCookie = adminCookieRaw ? decodeURIComponent(adminCookieRaw) : undefined;

  if (!isAdminTokenValid(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin client is not configured" }, { status: 500 });
  }

  try {
    const body = (await request.json()) as UpdateProfilePayload;

    const payload: Record<string, unknown> = {
      name: body.name,
      city: body.city,
      description: body.description,
      image_url: body.images?.[0] ?? null,
      height: body.height ?? "",
      languages: toStringArray(body.languages),
      availability: body.availability ?? "Unavailable",
      verified: Boolean(body.verified),
      is_top: Boolean(body.is_top),
      services: toStringArray(body.services),
      is_published: (body.availability ?? "Unavailable").toLowerCase() === "available"
    };

    const age = toIntOrNull(body.age);
    if (age !== null) payload.age = age;

    const price = toNumOrNull(body.price);
    if (price !== null) payload.price = price;

    const experienceYears = toIntOrNull(body.experience_years);
    if (experienceYears !== null) payload.experience_years = experienceYears;

    const rating = toNumOrNull(body.rating);
    if (rating !== null) payload.rating = rating;

    const { data, error } = await supabaseAdmin
      .from("listings")
      .update(payload)
      .eq("id", params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/admin/profiles");

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

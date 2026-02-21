import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type UpdateProfilePayload = {
  name?: string;
  age?: number;
  city?: string;
  price?: number;
  description?: string;
  images?: string[];
  height?: string;
  languages?: string[];
  availability?: string;
  verified?: boolean;
  isTop?: boolean;
  experienceYears?: number;
  rating?: number;
  services?: string[];
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
    const payload = {
      name: body.name,
      age: Number(body.age ?? 0),
      city: body.city,
      price: Number(body.price ?? 0),
      description: body.description,
      image_url: body.images?.[0] ?? null,
      height: body.height ?? "",
      languages: body.languages ?? [],
      availability: body.availability ?? "Unavailable",
      verified: Boolean(body.verified),
      is_top: Boolean(body.isTop),
      experience_years: Number(body.experienceYears ?? 0),
      rating: Number(body.rating ?? 0),
      services: body.services ?? [],
      is_published: (body.availability ?? "Unavailable").toLowerCase() === "available"
    };

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

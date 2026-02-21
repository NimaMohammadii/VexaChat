import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";
import { adminUpdateProfile } from "@/lib/profiles";

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
  if (Array.isArray(v)) return v;
  if (typeof v === "string") return v.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
};

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const adminCookie = cookies().get(ADMIN_COOKIE)?.value;
  if (!isAdminTokenValid(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as UpdateProfilePayload;
    const updated = await adminUpdateProfile(params.id, {
      name: body.name,
      city: body.city,
      description: body.description,
      images: body.images ?? [],
      height: body.height,
      languages: toStringArray(body.languages),
      availability: body.availability,
      verified: Boolean(body.verified),
      isTop: Boolean(body.is_top),
      services: toStringArray(body.services),
      age: toIntOrNull(body.age) ?? undefined,
      price: toNumOrNull(body.price) ?? undefined,
      experienceYears: toIntOrNull(body.experience_years) ?? undefined,
      rating: toNumOrNull(body.rating) ?? undefined
    });

    revalidatePath("/");
    revalidatePath("/admin/profiles");
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

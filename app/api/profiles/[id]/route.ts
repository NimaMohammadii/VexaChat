import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import {
  createOrUpdateProfileForUser,
  deleteProfile,
  getProfileById
} from "@/lib/profiles";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const existing = await getProfileById(params.id, true);
  if (existing && existing.supabaseUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await createOrUpdateProfileForUser(user.id, {
    name: body.name,
    age: body.age ? Number(body.age) : undefined,
    city: body.city,
    price: body.price ? Number(body.price) : undefined,
    description: body.description,
    images: body.images,
    height: body.height,
    languages: body.languages,
    availability: body.availability,
    verified: Boolean(body.verified),
    isTop: Boolean(body.isTop ?? body.is_top),
    experienceYears: body.experienceYears ? Number(body.experienceYears) : undefined,
    rating: body.rating ? Number(body.rating) : undefined,
    services: body.services
  });

  revalidatePath("/");
  revalidatePath("/admin/profiles");
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await deleteProfile(params.id);
  revalidatePath("/");
  revalidatePath("/admin/profiles");
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();
  if (formData.get("_method") === "DELETE") {
    await deleteProfile(params.id).catch(() => null);
    revalidatePath("/");
    revalidatePath("/admin/profiles");
  }

  return NextResponse.redirect(new URL("/admin/profiles", request.url));
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const profile = await getProfileById(params.id, true);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!profile.isPublished) {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user || profile.supabaseUserId !== user.id) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
  }

  return NextResponse.json(profile);
}

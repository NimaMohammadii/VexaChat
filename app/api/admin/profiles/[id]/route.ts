import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

type UpdateProfilePayload = {
  name?: string;
  city?: string;
  description?: string;
  image_url?: string | null;
  is_published?: boolean;
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
      city: body.city,
      description: body.description,
      image_url: body.image_url,
      is_published: body.is_published
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

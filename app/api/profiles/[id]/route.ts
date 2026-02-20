import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { deleteProfile, getProfileById, updateProfile } from "@/lib/profiles";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();

  try {
    const updated = await updateProfile(params.id, {
      name: body.name,
      age: Number(body.age),
      city: body.city,
      price: Number(body.price),
      description: body.description,
      images: body.images ?? [],
      height: body.height ?? "",
      languages: body.languages ?? [],
      availability: body.availability ?? "Unavailable",
      verified: Boolean(body.verified),
      isTop: Boolean(body.isTop),
      experienceYears: Number(body.experienceYears ?? 0),
      rating: Number(body.rating ?? 0),
      services: body.services ?? []
    });

    if (!updated) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/admin/profiles");

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteProfile(params.id);

    revalidatePath("/");
    revalidatePath("/admin/profiles");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
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
  const profile = await getProfileById(params.id);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

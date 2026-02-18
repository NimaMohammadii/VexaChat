import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUniqueProfileSlug } from "@/lib/profile-slug";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as {
    name?: string;
    age?: number | string;
    city?: string;
    price?: number | string;
    description?: string;
    images?: string[];
    height?: string;
    languages?: string[];
    availability?: string;
    verified?: boolean;
    isTop?: boolean;
    experienceYears?: number | string;
    rating?: number | string;
    services?: string[];
    slug?: string;
  };

  const existing = await prisma.profile.findUnique({ where: { id } });

  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const name = String(body.name ?? existing.name).trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = await createUniqueProfileSlug(body.slug ?? name, async (candidate) => {
    const match = await prisma.profile.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });

    return Boolean(match);
  }, existing.slug);

  const updated = await prisma.profile.update({
    where: { id },
    data: {
      slug,
      name,
      age: Number(body.age ?? existing.age),
      city: String(body.city ?? existing.city).trim(),
      price: Number(body.price ?? existing.price),
      description: String(body.description ?? existing.description).trim(),
      images: body.images ?? existing.images,
      height: body.height ?? existing.height,
      languages: body.languages ?? existing.languages,
      availability: body.availability ?? existing.availability,
      verified: Boolean(body.verified ?? existing.verified),
      isTop: Boolean(body.isTop ?? existing.isTop),
      experienceYears: Number(body.experienceYears ?? existing.experienceYears),
      rating: Number(body.rating ?? existing.rating),
      services: body.services ?? existing.services
    }
  });

  revalidatePath("/");
  revalidatePath("/admin/profiles");
  revalidatePath(`/profile/${updated.id}`);
  revalidatePath(`/profile/${updated.slug}`);

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await prisma.profile.delete({
      where: { id }
    });

    revalidatePath("/");
    revalidatePath("/admin/profiles");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();

  if (formData.get("_method") === "DELETE") {
    await prisma.profile.delete({
      where: { id }
    }).catch(() => null);

    revalidatePath("/");
    revalidatePath("/admin/profiles");
  }

  return NextResponse.redirect(new URL("/admin/profiles", request.url));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await prisma.profile.findUnique({
    where: { id }
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

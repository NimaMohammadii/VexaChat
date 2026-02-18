import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUniqueProfileSlug } from "@/lib/profile-slug";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
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

  const name = String(body.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = await createUniqueProfileSlug(body.slug ?? name, async (candidate) => {
    const existing = await prisma.profile.findUnique({
      where: { slug: candidate },
      select: { id: true }
    });

    return Boolean(existing);
  });

  const created = await prisma.profile.create({
    data: {
      slug,
      name,
      age: Number(body.age),
      city: String(body.city ?? "").trim(),
      price: Number(body.price),
      description: String(body.description ?? "").trim(),
      images: body.images ?? [],
      height: body.height ?? "",
      languages: body.languages ?? [],
      availability: body.availability ?? "Unavailable",
      verified: Boolean(body.verified),
      isTop: Boolean(body.isTop),
      experienceYears: Number(body.experienceYears ?? 0),
      rating: Number(body.rating ?? 0),
      services: body.services ?? []
    }
  });

  return NextResponse.json(created, { status: 201 });
}

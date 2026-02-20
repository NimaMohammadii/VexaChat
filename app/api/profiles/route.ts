import { NextResponse } from "next/server";
import { createProfile, listProfiles } from "@/lib/profiles";

export async function GET() {
  const profiles = await listProfiles();

  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const body = await request.json();

  const created = await createProfile({
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

  return NextResponse.json(created, { status: 201 });
}

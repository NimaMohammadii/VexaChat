import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase-server";

type UpdatePayload = {
  verified?: unknown;
  name?: unknown;
  age?: unknown;
  city?: unknown;
  price?: unknown;
  description?: unknown;
  imageUrls?: unknown;
  height?: unknown;
  languages?: unknown;
  availability?: unknown;
  isTop?: unknown;
  experienceYears?: unknown;
  rating?: unknown;
  services?: unknown;
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

async function deleteProfileStorageObjects(userId: string, profileId: string) {
  const supabase = createSupabaseServerClient();
  const bucket = "profile-images";
  const prefix = `${userId}/${profileId}`;

  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100 });

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return { error: null };
  }

  const paths = data.map((item) => `${prefix}/${item.name}`);
  const { error: removeError } = await supabase.storage.from(bucket).remove(paths);

  if (removeError) {
    return { error: removeError.message };
  }

  return { error: null };
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.profile.findUnique({ where: { id: params.id } });

  if (!existing || existing.ownerUserId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storageResult = await deleteProfileStorageObjects(user.id, params.id);
  if (storageResult.error) {
    return NextResponse.json({ error: `Failed to remove profile images: ${storageResult.error}` }, { status: 500 });
  }

  await prisma.profile.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.profile.findUnique({ where: { id: params.id } });

  if (!existing || existing.ownerUserId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as UpdatePayload;

  if (body.verified !== undefined) {
    return NextResponse.json({ error: "verified cannot be changed from this endpoint." }, { status: 400 });
  }
  const imageUrls = body.imageUrls !== undefined ? (readStringArray(body.imageUrls) ?? []) : undefined;

  if (imageUrls && imageUrls.length > 2) {
    return NextResponse.json({ error: "A profile can include at most 2 images." }, { status: 400 });
  }


  if (body.age !== undefined) {
    const age = readNumber(body.age);
    if (age === undefined || !Number.isInteger(age) || age < 18) {
      return NextResponse.json({ error: "Age must be an integer and at least 18." }, { status: 400 });
    }
  }

  if (body.price !== undefined) {
    const price = readNumber(body.price);
    if (price === undefined || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
    }
  }

  if (body.experienceYears !== undefined) {
    const experienceYears = readNumber(body.experienceYears);
    if (experienceYears === undefined || !Number.isFinite(experienceYears) || experienceYears < 0) {
      return NextResponse.json({ error: "Experience years must be a non-negative number." }, { status: 400 });
    }
  }

  if (body.rating !== undefined) {
    const rating = readNumber(body.rating);
    if (rating === undefined || !Number.isFinite(rating) || rating < 0 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 0 and 5." }, { status: 400 });
    }
  }

  const data = {
    ...(body.name !== undefined ? { name: readString(body.name) } : {}),
    ...(body.age !== undefined ? { age: readNumber(body.age) } : {}),
    ...(body.city !== undefined ? { city: readString(body.city) } : {}),
    ...(body.price !== undefined ? { price: readNumber(body.price) } : {}),
    ...(body.description !== undefined ? { description: readString(body.description) } : {}),
    ...(body.height !== undefined ? { height: readString(body.height) } : {}),
    ...(body.availability !== undefined ? { availability: readString(body.availability) } : {}),
    ...(body.experienceYears !== undefined ? { experienceYears: readNumber(body.experienceYears) } : {}),
    ...(body.rating !== undefined ? { rating: readNumber(body.rating) } : {}),
    ...(body.isTop !== undefined ? { isTop: Boolean(body.isTop) } : {}),
    ...(body.languages !== undefined ? { languages: readStringArray(body.languages) ?? [] } : {}),
    ...(body.services !== undefined ? { services: readStringArray(body.services) ?? [] } : {}),
    ...(imageUrls !== undefined ? { imageUrl: imageUrls[0] || "", images: imageUrls } : {})
  };

  const profile = await prisma.profile.update({
    where: { id: params.id },
    data
  });

  return NextResponse.json({ profile });
}

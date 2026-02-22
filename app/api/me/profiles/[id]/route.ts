import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

type UpdatePayload = {
  name?: unknown;
  age?: unknown;
  city?: unknown;
  price?: unknown;
  description?: unknown;
  imageUrl?: unknown;
  uploadedImageUrl?: unknown;
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

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.profile.findUnique({ where: { id: params.id } });

  if (!existing || existing.ownerUserId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.profile.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.profile.findUnique({ where: { id: params.id } });

  if (!existing || existing.ownerUserId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as UpdatePayload;

  const uploadedImageUrl = readString(body.uploadedImageUrl);
  const pastedImageUrl = readString(body.imageUrl);
  const imageUrl = uploadedImageUrl || pastedImageUrl;

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
    ...((body.imageUrl !== undefined || body.uploadedImageUrl !== undefined)
      ? {
          imageUrl,
          images: imageUrl ? [imageUrl] : []
        }
      : {})
  };

  const profile = await prisma.profile.update({
    where: { id: params.id },
    data
  });

  return NextResponse.json({ profile });
}

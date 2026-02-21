import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { Profile, ProfileInput } from "@/lib/types";

const baseSelect = {
  id: true,
  supabaseUserId: true,
  name: true,
  age: true,
  city: true,
  price: true,
  description: true,
  imageUrls: true,
  isPublished: true,
  height: true,
  languages: true,
  availability: true,
  verified: true,
  isTop: true,
  experienceYears: true,
  rating: true,
  services: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.ListingSelect;

type ListingRecord = Prisma.ListingGetPayload<{ select: typeof baseSelect }>;

const toProfile = (row: ListingRecord): Profile => ({
  id: row.id,
  supabaseUserId: row.supabaseUserId,
  name: row.name,
  age: row.age ?? 18,
  city: row.city,
  price: row.price ?? 0,
  description: row.description,
  images: row.imageUrls ?? [],
  isPublished: row.isPublished,
  height: row.height ?? "",
  languages: row.languages ?? [],
  availability: row.availability ?? "Unavailable",
  verified: row.verified,
  isTop: row.isTop,
  experienceYears: row.experienceYears ?? 0,
  rating: Number(row.rating ?? 0),
  services: row.services ?? [],
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString()
});

const toListingData = (data: Partial<ProfileInput>) => ({
  name: data.name,
  age: data.age,
  city: data.city,
  price: data.price,
  description: data.description,
  imageUrls: data.images,
  height: data.height,
  languages: data.languages,
  availability: data.availability,
  verified: data.verified,
  isTop: data.isTop,
  experienceYears: data.experienceYears,
  rating: data.rating === undefined ? undefined : new Prisma.Decimal(data.rating),
  services: data.services,
  isPublished:
    data.availability === undefined
      ? undefined
      : data.availability.toLowerCase() === "available"
});

export async function listProfilesPublic() {
  const profiles = await db.listing.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: baseSelect
  });

  return profiles.map(toProfile);
}

export async function getProfileById(id: string, includeUnpublished = false) {
  const profile = await db.listing.findFirst({
    where: { id, ...(includeUnpublished ? {} : { isPublished: true }) },
    select: baseSelect
  });

  return profile ? toProfile(profile) : null;
}

export async function createOrUpdateProfileForUser(supabaseUserId: string, payload: Partial<ProfileInput>) {
  const existing = await db.listing.findFirst({ where: { supabaseUserId }, select: { id: true } });

  if (existing) {
    return db.listing
      .update({
        where: { id: existing.id },
        data: toListingData(payload),
        select: baseSelect
      })
      .then(toProfile);
  }

  return db.listing
    .create({
      data: {
        supabaseUserId,
        name: payload.name ?? "User",
        city: payload.city ?? "",
        description: payload.description ?? "",
        imageUrls: payload.images ?? [],
        availability: payload.availability ?? "Unavailable",
        isPublished: (payload.availability ?? "Unavailable").toLowerCase() === "available",
        age: payload.age,
        price: payload.price,
        height: payload.height,
        languages: payload.languages ?? [],
        verified: payload.verified ?? false,
        isTop: payload.isTop ?? false,
        experienceYears: payload.experienceYears,
        rating: payload.rating === undefined ? undefined : new Prisma.Decimal(payload.rating),
        services: payload.services ?? []
      },
      select: baseSelect
    })
    .then(toProfile);
}

export async function adminUpdateProfile(id: string, payload: Partial<ProfileInput>) {
  const updated = await db.listing.update({
    where: { id },
    data: toListingData(payload),
    select: baseSelect
  });

  return toProfile(updated);
}

export async function adminListProfiles() {
  const profiles = await db.listing.findMany({
    orderBy: { createdAt: "desc" },
    select: baseSelect
  });

  return profiles.map(toProfile);
}

export async function deleteProfile(id: string) {
  await db.listing.delete({ where: { id } });
}

export async function createAdminProfile(payload: ProfileInput) {
  const created = await db.listing.create({
    data: {
      ...toListingData(payload),
      name: payload.name,
      city: payload.city,
      description: payload.description,
      imageUrls: payload.images ?? []
    },
    select: baseSelect
  });

  return toProfile(created);
}

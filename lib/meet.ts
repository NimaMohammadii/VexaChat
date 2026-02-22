import { prisma } from "@/lib/prisma";

export const MEET_BUCKET = "meet-images";

export type MeetCardInput = {
  displayName?: unknown;
  age?: unknown;
  city?: unknown;
  gender?: unknown;
  lookingFor?: unknown;
  bio?: unknown;
  questionPrompt?: unknown;
  answer?: unknown;
  imageUrls?: unknown;
  isAdultConfirmed?: unknown;
  isActive?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

export function validateMeetCardPayload(body: MeetCardInput, mode: "create" | "update") {
  const displayName = body.displayName !== undefined ? asString(body.displayName) : undefined;
  const age = body.age !== undefined ? asNumber(body.age) : undefined;
  const city = body.city !== undefined ? asString(body.city) : undefined;
  const gender = body.gender !== undefined ? asString(body.gender) : undefined;
  const lookingFor = body.lookingFor !== undefined ? asString(body.lookingFor) : undefined;
  const bio = body.bio !== undefined ? asString(body.bio) : undefined;
  const questionPrompt = body.questionPrompt !== undefined ? asString(body.questionPrompt) : undefined;
  const answer = body.answer !== undefined ? asString(body.answer) : undefined;
  const imageUrls = body.imageUrls !== undefined ? asStringArray(body.imageUrls) : undefined;
  const isAdultConfirmed = typeof body.isAdultConfirmed === "boolean" ? body.isAdultConfirmed : undefined;
  const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

  if (mode === "create") {
    if (!displayName || !city || !gender || !lookingFor || !Number.isInteger(age)) {
      return { error: "displayName, age, city, gender and lookingFor are required." };
    }
  }

  if (age !== undefined && (!Number.isInteger(age) || age < 18)) {
    return { error: "Age must be an integer and at least 18." };
  }

  if (imageUrls && imageUrls.length > 2) {
    return { error: "A Meet card can include at most 2 images." };
  }

  const data = {
    ...(displayName !== undefined ? { displayName } : {}),
    ...(age !== undefined ? { age } : {}),
    ...(city !== undefined ? { city } : {}),
    ...(gender !== undefined ? { gender } : {}),
    ...(lookingFor !== undefined ? { lookingFor } : {}),
    ...(bio !== undefined ? { bio: bio || null } : {}),
    ...(questionPrompt !== undefined ? { questionPrompt: questionPrompt || null } : {}),
    ...(answer !== undefined ? { answer: answer || null } : {}),
    ...(imageUrls !== undefined ? { imageUrls } : {}),
    ...(isAdultConfirmed !== undefined ? { isAdultConfirmed } : {}),
    ...(isActive !== undefined ? { isActive } : {})
  };

  if (mode === "update" && Object.keys(data).length === 0) {
    return { error: "No fields to update." };
  }

  return { data };
}

export async function enforceActionRateLimit(userId: string, kind: "card" | "swipe") {
  if (kind === "swipe") {
    const minuteAgo = new Date(Date.now() - 60 * 1000);
    const [likes, passes] = await Promise.all([
      prisma.meetLike.count({ where: { fromUserId: userId, createdAt: { gte: minuteAgo } } }),
      prisma.meetPass.count({ where: { fromUserId: userId, createdAt: { gte: minuteAgo } } })
    ]);
    return likes + passes < 60;
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const edits = await prisma.meetCard.count({ where: { userId, updatedAt: { gte: hourAgo } } });
  return edits < 5;
}

export const meetGenders = ["male", "female", "other", "prefer_not"] as const;
export const meetLookingFor = ["male", "female", "any"] as const;

export type MeetGender = (typeof meetGenders)[number];
export type MeetLookingFor = (typeof meetLookingFor)[number];

export type MeetCardPayload = {
  displayName?: string;
  age?: number;
  countryCode?: string;
  city?: string;
  gender?: string;
  lookingFor?: string;
  intentTags?: string[];
  bio?: string;
  imageUrl?: string;
  isAdultConfirmed?: boolean;
  isActive?: boolean;
};

export function orderedUserPair(firstUserId: string, secondUserId: string) {
  return firstUserId < secondUserId
    ? { userLowId: firstUserId, userHighId: secondUserId }
    : { userLowId: secondUserId, userHighId: firstUserId };
}

export function validateMeetCardPayload(payload: MeetCardPayload, mode: "create" | "update") {
  const displayName = payload.displayName?.trim();
  const city = payload.city?.trim();
  const countryCode = payload.countryCode?.trim();
  const gender = payload.gender;
  const lookingFor = payload.lookingFor;
  const intentTags = payload.intentTags?.map((tag) => tag.trim()).filter(Boolean) ?? [];
  const bio = payload.bio?.trim() ?? "";
  const imageUrl = payload.imageUrl?.trim();

  if ((mode === "create" || payload.displayName !== undefined) && !displayName) {
    return { error: "Display name is required." } as const;
  }

  if ((mode === "create" || payload.city !== undefined) && !city) {
    return { error: "City is required." } as const;
  }

  if ((mode === "create" || payload.countryCode !== undefined) && !countryCode) {
    return { error: "Country is required." } as const;
  }

  if ((mode === "create" || payload.gender !== undefined) && !meetGenders.includes(gender as MeetGender)) {
    return { error: "Invalid gender." } as const;
  }

  if ((mode === "create" || payload.lookingFor !== undefined) && !meetLookingFor.includes(lookingFor as MeetLookingFor)) {
    return { error: "Invalid lookingFor value." } as const;
  }

  if (mode === "create" || payload.intentTags !== undefined) {
    if (intentTags.length < 1 || intentTags.length > 5) {
      return { error: "Select between 1 and 5 intent tags." } as const;
    }
  }

  if (bio.length > 280) {
    return { error: "Bio must be 280 characters or less." } as const;
  }

  if ((mode === "create" || payload.imageUrl !== undefined) && !imageUrl) {
    return { error: "Image is required." } as const;
  }

  if (imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))) {
    return { error: "imageUrl must be a storage key, not a direct URL." } as const;
  }

  if (mode === "create") {
    if (typeof payload.age !== "number" || !Number.isInteger(payload.age)) {
      return { error: "Age is required." } as const;
    }

    if (payload.age < 18) {
      return { error: "Must be 18+." } as const;
    }

    if (!payload.isAdultConfirmed) {
      return { error: "Adult confirmation is required." } as const;
    }
  }

  if (payload.age !== undefined && (payload.age < 18 || !Number.isInteger(payload.age))) {
    return { error: "Age must be an integer and at least 18." } as const;
  }

  return {
    data: {
      displayName,
      age: payload.age,
      countryCode,
      city,
      gender: gender as MeetGender | undefined,
      lookingFor: lookingFor as MeetLookingFor | undefined,
      intentTags,
      bio,
      imageUrl,
      isAdultConfirmed: payload.isAdultConfirmed,
      isActive: payload.isActive
    }
  } as const;
}

import type { Profile } from "./types";

const profiles = new Map<string, Profile>();

export function listProfiles(): Profile[] {
  return Array.from(profiles.values());
}

export function getProfile(id: string): Profile | null {
  return profiles.get(id) ?? null;
}

export function upsertProfile(profile: Profile): Profile {
  profiles.set(profile.id, profile);
  return profile;
}

export function removeProfile(id: string): boolean {
  return profiles.delete(id);
}

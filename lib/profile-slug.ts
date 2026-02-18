export function slugifyProfileName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createUniqueProfileSlug(
  baseValue: string,
  slugExists: (slug: string) => Promise<boolean>,
  excludedSlug?: string
) {
  const baseSlug = slugifyProfileName(baseValue) || "profile";

  if (baseSlug === excludedSlug) {
    return baseSlug;
  }

  if (!(await slugExists(baseSlug))) {
    return baseSlug;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${baseSlug}-${suffix}`;

    if (candidate === excludedSlug) {
      continue;
    }

    if (!(await slugExists(candidate))) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique profile slug");
}

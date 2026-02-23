import { prisma } from "@/lib/prisma";

export const defaultHomePageConfig = {
  heroTitle: "Where Desire Meets",
  heroAccentWord: "Discretion",
  heroSubtitle: "Refined discovery for people who value privacy, curation, and meaningful introductions.",
  primaryCtaText: "Explore the Experience",
  secondaryCtaText: "Create Your Profile"
};

export async function ensureHomePageConfig() {
  const existing = await prisma.homePageConfig.findFirst();

  if (existing) {
    return existing;
  }

  return prisma.homePageConfig.create({
    data: defaultHomePageConfig
  });
}

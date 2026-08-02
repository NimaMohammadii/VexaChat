import { prisma } from "@/lib/prisma";

export const defaultHomePageConfig = {
  heroTitle: "A quieter way to",
  heroAccentWord: "connect",
  heroSubtitle: "Vexa brings private conversations, meaningful introductions, and real presence into one beautifully simple space.",
  primaryCtaText: "Enter Vexa",
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

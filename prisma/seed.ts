import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultHomePageConfig = {
  heroTitle: "Where Desire Meets",
  heroAccentWord: "Discretion",
  heroSubtitle: "Refined discovery for people who value privacy, curation, and meaningful introductions.",
  primaryCtaText: "Start Exploring",
  secondaryCtaText: "Create Your Profile"
};

const defaultHomeSections = [
  {
    key: "hero_bg",
    title: "Curated introductions built for calm attention",
    subtitle: "A quieter way to discover verified people and meaningful chemistry.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    ctaText: "Start Exploring",
    ctaHref: "#featured-profiles",
    order: 0,
    isActive: true
  },
  {
    key: "featured_1",
    title: "Intentional moments, designed with privacy first",
    subtitle: "Every touchpoint favors discretion, clarity, and premium simplicity.",
    imageUrl: "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=1600&q=80",
    ctaText: "Browse Profiles",
    ctaHref: "/meet/browse",
    order: 1,
    isActive: true
  },
  {
    key: "featured_2",
    title: "Editorial quality across every profile surface",
    subtitle: "Minimal visuals and thoughtful pacing keep the experience refined.",
    imageUrl: "https://images.unsplash.com/photo-1496128858413-b36217c2ce36?auto=format&fit=crop&w=1600&q=80",
    ctaText: "Create Profile",
    ctaHref: "/me/create-profile",
    order: 2,
    isActive: true
  },
  {
    key: "promo_1",
    title: "Verification-first experiences for better trust",
    subtitle: "Profiles and interactions are built around confidence, discretion, and quality.",
    imageUrl: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1600&q=80",
    ctaText: "Get Verified",
    ctaHref: "/me/verification",
    order: 3,
    isActive: true
  }
];

async function main() {
  const existingConfig = await prisma.homePageConfig.findFirst();
  if (!existingConfig) {
    await prisma.homePageConfig.create({ data: defaultHomePageConfig });
  }

  const sectionCount = await prisma.homeSection.count();
  if (sectionCount === 0) {
    await prisma.homeSection.createMany({ data: defaultHomeSections });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

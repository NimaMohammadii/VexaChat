-- AlterTable
ALTER TABLE "HomeSection"
ALTER COLUMN "subtitle" DROP NOT NULL;

-- CreateTable
CREATE TABLE "HomePageConfig" (
    "id" TEXT NOT NULL,
    "heroTitle" TEXT NOT NULL,
    "heroAccentWord" TEXT,
    "heroSubtitle" TEXT NOT NULL,
    "primaryCtaText" TEXT NOT NULL,
    "secondaryCtaText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomePageConfig_pkey" PRIMARY KEY ("id")
);

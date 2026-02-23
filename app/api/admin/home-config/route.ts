import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ensureHomePageConfig } from "@/lib/homepage-config";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function normalizeRequiredString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function GET() {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const config = await ensureHomePageConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error("[admin/home-config][GET]", error);
    return NextResponse.json({ error: "Unable to load home config" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const config = await ensureHomePageConfig();
    const body = (await request.json()) as {
      heroTitle?: string;
      heroAccentWord?: string;
      heroSubtitle?: string;
      primaryCtaText?: string;
      secondaryCtaText?: string;
    };

    const heroTitle = normalizeRequiredString(body.heroTitle);
    const heroSubtitle = normalizeRequiredString(body.heroSubtitle);
    const primaryCtaText = normalizeRequiredString(body.primaryCtaText);

    if (!heroTitle || !heroSubtitle || !primaryCtaText) {
      return NextResponse.json(
        { error: "heroTitle, heroSubtitle and primaryCtaText are required" },
        { status: 400 }
      );
    }

    const updated = await prisma.homePageConfig.update({
      where: { id: config.id },
      data: {
        heroTitle,
        heroAccentWord: normalizeOptionalString(body.heroAccentWord) ?? null,
        heroSubtitle,
        primaryCtaText,
        secondaryCtaText: normalizeOptionalString(body.secondaryCtaText) ?? null
      }
    });

    return NextResponse.json({ config: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[admin/home-config][PATCH] Prisma", error.code, error.message);
    } else {
      console.error("[admin/home-config][PATCH]", error);
    }

    return NextResponse.json({ error: "Unable to save home config" }, { status: 500 });
  }
}

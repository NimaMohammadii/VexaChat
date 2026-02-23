import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ensureDefaultHomeSections, getPlaceholderSection } from "@/lib/homepage-config";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

const DB_NOT_READY_MESSAGE = "Database not ready. Run migrations on production DB.";

function logPrismaError(context: string, err: unknown) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`${context} Prisma error`, {
      code: err.code,
      message: err.message,
      meta: err.meta
    });
    return;
  }

  console.error(context, err);
}

function parseOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function parseRequiredString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function GET() {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await ensureDefaultHomeSections();
    const sections = await prisma.homeSection.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json({ sections });
  } catch (err) {
    logPrismaError("[admin/home-sections][GET] Prisma query failed", err);
    return NextResponse.json({ error: DB_NOT_READY_MESSAGE }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      key?: string;
      title?: string;
      subtitle?: string;
      imageUrl?: string;
      ctaText?: string;
      ctaHref?: string;
      order?: number;
      isActive?: boolean;
    };

    const latest = await prisma.homeSection.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    const nextOrder = (latest?.order ?? -1) + 1;
    const fallback = getPlaceholderSection(nextOrder);

    const title = parseRequiredString(body.title) ?? fallback.title;
    const imageUrl = parseRequiredString(body.imageUrl) ?? fallback.imageUrl;

    const created = await prisma.homeSection.create({
      data: {
        key: parseOptionalString(body.key) ?? fallback.key,
        title,
        subtitle: parseOptionalString(body.subtitle),
        imageUrl,
        ctaText: parseOptionalString(body.ctaText),
        ctaHref: parseOptionalString(body.ctaHref),
        order: Number.isFinite(body.order) ? Number(body.order) : nextOrder,
        isActive: typeof body.isActive === "boolean" ? body.isActive : true
      }
    });

    return NextResponse.json({ section: created }, { status: 201 });
  } catch (err) {
    logPrismaError("[admin/home-sections][POST] Prisma mutation failed", err);
    return NextResponse.json({ error: DB_NOT_READY_MESSAGE }, { status: 500 });
  }
}

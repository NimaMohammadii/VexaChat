import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

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

export async function GET() {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const sections = await prisma.homeSection.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }]
    });

    const sectionsWithResolvedUrls = await Promise.all(
      sections.map(async (section) => ({
        ...section,
        imageUrl: await resolveStoredFileUrl(section.imageUrl)
      }))
    );

    return NextResponse.json({ sections: sectionsWithResolvedUrls });
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
    const body = (await request.json()) as {
      title?: string;
      subtitle?: string;
      imageUrl?: string;
      order?: number;
      isActive?: boolean;
    };

    const title = String(body.title ?? "").trim();
    const imageUrl = String(body.imageUrl ?? "").trim();

    if (!title || !imageUrl) {
      return NextResponse.json({ error: "title and imageUrl are required" }, { status: 400 });
    }

    const latest = await prisma.homeSection.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
    const nextOrder = (latest?.order ?? -1) + 1;

    const created = await prisma.homeSection.create({
      data: {
        title,
        subtitle: parseOptionalString(body.subtitle) ?? null,
        imageUrl,
        order: Number.isFinite(body.order) ? Number(body.order) : nextOrder,
        isActive: body.isActive ?? true
      }
    });

    return NextResponse.json({ section: { ...created, imageUrl: await resolveStoredFileUrl(created.imageUrl) } }, { status: 201 });
  } catch (err) {
    logPrismaError("[admin/home-sections][POST] Prisma mutation failed", err);
    return NextResponse.json({ error: DB_NOT_READY_MESSAGE }, { status: 500 });
  }
}

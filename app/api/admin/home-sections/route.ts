import { NextRequest, NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sections = await prisma.homeSection.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ sections });
}

export async function POST(request: NextRequest) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const created = await prisma.homeSection.create({
    data: {
      title,
      subtitle: String(body.subtitle ?? "").trim() || null,
      imageUrl,
      order: Number.isFinite(body.order) ? Number(body.order) : 0,
      isActive: body.isActive ?? true
    }
  });

  return NextResponse.json({ section: created }, { status: 201 });
}

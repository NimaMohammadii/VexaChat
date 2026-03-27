import { NextRequest, NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { ensureMenuAccessConfig, normalizeMenuLockKeys } from "@/lib/menu-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const config = await ensureMenuAccessConfig();
    return NextResponse.json({ lockedKeys: config.lockedKeys });
  } catch (error) {
    console.error("[admin/menu-access][GET]", error);
    return NextResponse.json({ error: "Unable to load menu access settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const config = await ensureMenuAccessConfig();
    const body = (await request.json()) as { lockedKeys?: unknown };
    const lockedKeys = normalizeMenuLockKeys(body.lockedKeys);

    if (!lockedKeys) {
      return NextResponse.json({ error: "lockedKeys must be an array of valid menu keys" }, { status: 400 });
    }

    const updated = await prisma.menuAccessConfig.update({
      where: { id: config.id },
      data: { lockedKeys }
    });

    return NextResponse.json({ lockedKeys: updated.lockedKeys });
  } catch (error) {
    console.error("[admin/menu-access][PATCH]", error);
    return NextResponse.json({ error: "Unable to save menu access settings" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { isAdminAccessAllowed } from "@/lib/admin-access";
import { deleteStoredMedia } from "@/lib/media-storage";

export async function POST(request: NextRequest) {
  const hasAdminAccess = await isAdminAccessAllowed();

  if (!hasAdminAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { path?: string; url?: string };
    const target = (body.path ?? body.url ?? "").trim();

    if (!target) {
      return NextResponse.json({ error: "Missing media target" }, { status: 400 });
    }

    await deleteStoredMedia(target);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to delete media" }, { status: 500 });
  }
}

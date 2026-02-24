import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { deleteObjectByKey, isLegacyUrl } from "@/lib/storage/object-storage";
import { getR2EnvPresence } from "@/lib/r2/client";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { key?: string };
  const key = body.key?.trim() ?? "";

  if (!key) {
    return NextResponse.json({ error: "key is required." }, { status: 400 });
  }

  try {
    if (!isLegacyUrl(key)) {
      await deleteObjectByKey(key);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[storage/delete] Failed to delete object", {
      error,
      envPresence: getR2EnvPresence()
    });
    return NextResponse.json({ error: "Unable to delete stored file right now." }, { status: 500 });
  }
}

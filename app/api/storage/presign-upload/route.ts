import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { assertStorageKey, getSignedUploadUrl } from "@/lib/storage/object-storage";
import { getR2EnvPresence } from "@/lib/r2/client";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { key?: string; contentType?: string };
  const key = body.key?.trim() ?? "";
  const contentType = body.contentType?.trim() ?? "";

  if (!key || !contentType) {
    return NextResponse.json({ error: "key and contentType are required." }, { status: 400 });
  }

  try {
    const uploadUrl = await getSignedUploadUrl(assertStorageKey(key, "key"), contentType, 10 * 60);
    return NextResponse.json({ uploadUrl, key });
  } catch (error) {
    if (error instanceof Error && error.message.includes("received URL")) {
      return NextResponse.json({ error: "key must be an R2 storage key." }, { status: 400 });
    }

    console.error("[storage/presign-upload] Failed to create upload presign", {
      error,
      envPresence: getR2EnvPresence()
    });
    return NextResponse.json({ error: "Unable to create upload URL right now." }, { status: 500 });
  }
}

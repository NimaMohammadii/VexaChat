import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { getSignedUploadUrl } from "@/lib/storage/object-storage";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { key?: string; contentType?: string };
  const key = body.key?.trim() ?? "";
  const contentType = body.contentType?.trim() ?? "";

  if (!key || !contentType) {
    return NextResponse.json({ error: "key and contentType are required." }, { status: 400 });
  }

  const uploadUrl = await getSignedUploadUrl(key, contentType, 10 * 60);
  return NextResponse.json({ uploadUrl, key });
}

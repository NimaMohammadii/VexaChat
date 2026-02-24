import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { resolveStoredFileUrl } from "@/lib/storage/object-storage";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { key?: string };
  const key = body.key?.trim() ?? "";

  if (!key) {
    return NextResponse.json({ error: "key is required." }, { status: 400 });
  }

  const url = await resolveStoredFileUrl(key);
  return NextResponse.json({ url });
}

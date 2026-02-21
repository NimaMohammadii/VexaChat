import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";

export async function GET() {
  const adminCookie = cookies().get(ADMIN_COOKIE)?.value;

  if (!isAdminTokenValid(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

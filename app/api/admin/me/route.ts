import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";

export async function GET(request: Request) {
  const adminCookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${ADMIN_COOKIE}=`))
    ?.split("=")[1];

  if (!isAdminTokenValid(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}

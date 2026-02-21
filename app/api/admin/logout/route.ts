import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/auth";

export async function POST(request: Request) {
  const adminCookie = cookies().get(ADMIN_COOKIE)?.value;

  if (!isAdminTokenValid(adminCookie)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.redirect(new URL("/admin-login", request.url));
  response.cookies.set({ name: ADMIN_COOKIE, value: "", maxAge: 0, path: "/" });
  return response;
}

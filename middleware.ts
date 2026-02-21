import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/admin-auth";

export function middleware(request: NextRequest) {
  const cookieValue = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!isAdminTokenValid(cookieValue)) {
    return NextResponse.redirect(new URL("/admin-login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"]
};

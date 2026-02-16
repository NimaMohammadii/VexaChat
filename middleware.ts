import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!process.env.SECRET_KEY || key !== process.env.SECRET_KEY) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};

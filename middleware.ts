import { NextRequest, NextResponse } from "next/server";

function safeKeyMatch(provided: string | null, expected: string): boolean {
  if (!provided || provided.length !== expected.length) {
    return false;
  }

  let diff = 0;

  for (let i = 0; i < provided.length; i += 1) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return diff === 0;
}

export function middleware(request: NextRequest) {
  const secretKey = process.env.SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("[middleware] SECRET_KEY is missing in production. Admin access is disabled.");
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  const providedKey = request.nextUrl.searchParams.get("key");

  if (!safeKeyMatch(providedKey, secretKey)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

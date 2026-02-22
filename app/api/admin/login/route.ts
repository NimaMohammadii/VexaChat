import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getAdminToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  const secret = process.env.SECRET_KEY;

  if (!secret || password !== secret) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: getAdminToken(secret),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return response;
}

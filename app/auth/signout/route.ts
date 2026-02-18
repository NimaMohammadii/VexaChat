import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set({ name: "sb-access-token", value: "", maxAge: 0, path: "/" });
  response.cookies.set({ name: "sb-refresh-token", value: "", maxAge: 0, path: "/" });
  response.cookies.set({ name: "sb-code-verifier", value: "", maxAge: 0, path: "/" });

  return response;
}

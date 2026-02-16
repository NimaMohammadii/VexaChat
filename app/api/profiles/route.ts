import { NextResponse } from "next/server";
import { getProfiles } from "@/lib/profile-store";

export async function GET() {
  return NextResponse.json(getProfiles());
}

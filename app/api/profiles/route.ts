import { NextResponse } from "next/server";
import { listProfiles } from "@/lib/profile-store";

export async function GET() {
  return NextResponse.json(listProfiles());
}

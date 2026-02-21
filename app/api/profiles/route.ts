import { NextResponse } from "next/server";
import { listProfilesPublic } from "@/lib/profiles";

export async function GET() {
  const profiles = await listProfilesPublic();
  return NextResponse.json(profiles);
}

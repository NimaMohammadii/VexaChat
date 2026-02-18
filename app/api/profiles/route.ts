import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const profiles = await prisma.profile.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(profiles);
}

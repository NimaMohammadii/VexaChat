import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const profile = await prisma.profile.findUnique({ where: { id: params.id } });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const data = await request.json();

  const profile = await prisma.profile.update({
    where: { id: params.id },
    data
  });

  return NextResponse.json(profile);
}

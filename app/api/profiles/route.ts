import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const body = await request.json();

  const created = await prisma.profile.create({
    data: {
      name: body.name,
      age: Number(body.age),
      city: body.city,
      price: Number(body.price),
      description: body.description,
      images: body.images ?? []
    }
  });

  return NextResponse.json(created, { status: 201 });
}

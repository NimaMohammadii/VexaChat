import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();

  try {
    const updated = await prisma.profile.update({
      where: { id: params.id },
      data: {
        name: body.name,
        age: Number(body.age),
        city: body.city,
        price: Number(body.price),
        description: body.description,
        images: body.images ?? []
      }
    });

    revalidatePath("/");
    revalidatePath("/admin/profiles");

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.profile.delete({
      where: { id: params.id }
    });

    revalidatePath("/");
    revalidatePath("/admin/profiles");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData();

  if (formData.get("_method") === "DELETE") {
    await prisma.profile.delete({
      where: { id: params.id }
    }).catch(() => null);

    revalidatePath("/");
    revalidatePath("/admin/profiles");
  }

  return NextResponse.redirect(new URL("/admin/profiles", request.url));
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const profile = await prisma.profile.findUnique({
    where: { id: params.id }
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

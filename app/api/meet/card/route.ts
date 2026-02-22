import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMeetCardPayload, parseStoragePathFromUrl, type MeetCardPayload } from "@/lib/meet";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await prisma.meetCard.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ card });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as MeetCardPayload;
  const validated = validateMeetCardPayload(body, "create");

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const card = await prisma.meetCard.create({
      data: {
        userId: user.id,
        displayName: validated.data.displayName!,
        age: validated.data.age!,
        city: validated.data.city!,
        gender: validated.data.gender!,
        lookingFor: validated.data.lookingFor!,
        intentTags: validated.data.intentTags,
        bio: validated.data.bio || null,
        imageUrl: validated.data.imageUrl!,
        isAdultConfirmed: true,
        adultConfirmedAt: new Date(),
        isActive: true
      }
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Meet card already exists." }, { status: 409 });
    }

    console.error("Failed to create meet card", error);
    return NextResponse.json({ error: "Unable to create meet card." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as MeetCardPayload;
  const validated = validateMeetCardPayload(body, "update");

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const current = await prisma.meetCard.findUnique({ where: { userId: user.id } });

  if (!current) {
    return NextResponse.json({ error: "Meet card not found." }, { status: 404 });
  }

  if (body.isAdultConfirmed === false || (validated.data.age !== undefined && validated.data.age < 18)) {
    return NextResponse.json({ error: "Adult requirements must remain satisfied." }, { status: 400 });
  }

  const updated = await prisma.meetCard.update({
    where: { userId: user.id },
    data: {
      displayName: validated.data.displayName ?? undefined,
      age: validated.data.age,
      city: validated.data.city ?? undefined,
      gender: validated.data.gender ?? undefined,
      lookingFor: validated.data.lookingFor ?? undefined,
      intentTags: body.intentTags !== undefined ? validated.data.intentTags : undefined,
      bio: body.bio !== undefined ? (validated.data.bio || null) : undefined,
      imageUrl: validated.data.imageUrl ?? undefined,
      isActive: validated.data.isActive,
      isAdultConfirmed: true,
      adultConfirmedAt: current.adultConfirmedAt ?? new Date()
    }
  });

  if (validated.data.imageUrl && validated.data.imageUrl !== current.imageUrl) {
    const oldPath = parseStoragePathFromUrl(current.imageUrl);

    if (oldPath) {
      const supabase = createSupabaseServerClient({ canSetCookies: false });
      await supabase.storage.from("meet-images").remove([oldPath]);
    }
  }

  return NextResponse.json({ card: updated });
}

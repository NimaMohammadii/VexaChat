import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseStoragePathFromUrl, validateMeetCardPayload, type MeetCardPayload } from "@/lib/meet";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase-server";

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await prisma.meetCard.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ card });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as MeetCardPayload;
  const validated = validateMeetCardPayload(body, "create");
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const existing = await prisma.meetCard.findUnique({ where: { userId: user.id } });
  const card = await prisma.meetCard.upsert({
    where: { userId: user.id },
    update: {
      displayName: validated.data.displayName!,
      age: validated.data.age!,
      city: validated.data.city!,
      gender: validated.data.gender!,
      lookingFor: validated.data.lookingFor!,
      intentTags: validated.data.intentTags,
      bio: validated.data.bio || null,
      imageUrl: validated.data.imageUrl!,
      isAdultConfirmed: true,
      adultConfirmedAt: existing?.adultConfirmedAt ?? new Date(),
      isActive: true
    },
    create: {
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

  if (existing?.imageUrl && existing.imageUrl !== card.imageUrl) {
    const oldPath = parseStoragePathFromUrl(existing.imageUrl);
    if (oldPath) {
      const supabase = createSupabaseServerClient({ canSetCookies: false });
      await supabase.storage.from("meet-images").remove([oldPath]);
    }
  }

  return NextResponse.json({ card }, { status: existing ? 200 : 201 });
}

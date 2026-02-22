import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase-server";
import { enforceActionRateLimit, MEET_BUCKET, type MeetCardInput, validateMeetCardPayload } from "@/lib/meet";

function extractObjectPath(url: string) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${MEET_BUCKET}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx >= 0) return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    return decodeURIComponent(parsed.pathname.split(`/${MEET_BUCKET}/`)[1] || "");
  } catch {
    return "";
  }
}

async function cleanupImages(urls: string[]) {
  const paths = urls.map(extractObjectPath).filter(Boolean);
  if (!paths.length) return;
  const supabase = createSupabaseServerClient();
  await supabase.storage.from(MEET_BUCKET).remove(paths);
}

export async function GET() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await prisma.meetCard.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ card });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await enforceActionRateLimit(user.id, "card"))) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 5 card updates per hour." }, { status: 429 });
  }

  const body = (await request.json()) as MeetCardInput;
  const validated = validateMeetCardPayload(body, "create");
  if ("error" in validated) return NextResponse.json({ error: validated.error }, { status: 400 });

  if (!validated.data.isAdultConfirmed || validated.data.age! < 18) {
    return NextResponse.json({ error: "18+ confirmation is required." }, { status: 400 });
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
        bio: validated.data.bio ?? null,
        questionPrompt: validated.data.questionPrompt ?? null,
        answer: validated.data.answer ?? null,
        imageUrls: validated.data.imageUrls ?? [],
        isAdultConfirmed: true,
        adultConfirmedAt: new Date(),
        isActive: validated.data.isActive ?? true
      }
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Only one Meet card is allowed per user." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create card." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await enforceActionRateLimit(user.id, "card"))) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 5 card updates per hour." }, { status: 429 });
  }

  const existing = await prisma.meetCard.findUnique({ where: { userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Meet card not found." }, { status: 404 });

  const body = (await request.json()) as MeetCardInput;
  const validated = validateMeetCardPayload(body, "update");
  if ("error" in validated) return NextResponse.json({ error: validated.error }, { status: 400 });

  if ((validated.data.age !== undefined && validated.data.age < 18) || (validated.data.isAdultConfirmed === false)) {
    return NextResponse.json({ error: "18+ confirmation is required." }, { status: 400 });
  }

  if (validated.data.imageUrls) {
    const removed = existing.imageUrls.filter((url) => !validated.data.imageUrls?.includes(url));
    await cleanupImages(removed);
  }

  const card = await prisma.meetCard.update({
    where: { userId: user.id },
    data: {
      ...validated.data,
      ...(validated.data.isAdultConfirmed ? { adultConfirmedAt: existing.adultConfirmedAt ?? new Date() } : {})
    }
  });

  return NextResponse.json({ card });
}

export async function DELETE() {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const card = await prisma.meetCard.findUnique({ where: { userId: user.id } });
  if (!card) return NextResponse.json({ ok: true });

  await cleanupImages(card.imageUrls);

  await prisma.$transaction([
    prisma.meetLike.deleteMany({ where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] } }),
    prisma.meetPass.deleteMany({ where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] } }),
    prisma.meetFollow.deleteMany({ where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] } }),
    prisma.meetBlock.deleteMany({ where: { OR: [{ blockerUserId: user.id }, { blockedUserId: user.id }] } }),
    prisma.meetCard.delete({ where: { userId: user.id } })
  ]);

  return NextResponse.json({ ok: true });
}

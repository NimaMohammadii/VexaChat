import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteChatMedia } from "@/lib/storage";

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret") ?? "";
  const expected = process.env.CRON_SECRET;

  if (!expected || cronSecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expiredMedia = await prisma.chatMedia.findMany({
    where: { expiresAt: { lt: now } },
    select: { id: true, storageKey: true }
  });

  if (!expiredMedia.length) {
    return NextResponse.json({ deletedMedia: 0 });
  }

  let deletedMedia = 0;

  for (const media of expiredMedia) {
    try {
      await deleteChatMedia({ key: media.storageKey });
      await prisma.chatMedia.delete({ where: { id: media.id } });
      deletedMedia += 1;
    } catch {
      // Continue cleanup for remaining records.
    }
  }

  return NextResponse.json({ deletedMedia });
}

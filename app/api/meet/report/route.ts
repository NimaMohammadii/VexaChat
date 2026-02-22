import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { reportedUserId?: string; reason?: string };
  const reportedUserId = body.reportedUserId?.trim();
  const reason = body.reason?.trim();

  if (!reportedUserId || reportedUserId === user.id) {
    return NextResponse.json({ error: "Invalid reported user." }, { status: 400 });
  }

  if (!reason || reason.length < 4 || reason.length > 280) {
    return NextResponse.json({ error: "Reason must be 4-280 characters." }, { status: 400 });
  }

  await prisma.meetReport.create({ data: { reporterUserId: user.id, reportedUserId, reason } });
  return NextResponse.json({ ok: true });
}

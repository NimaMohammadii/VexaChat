import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser({ canSetCookies: true });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { reportedUserId?: string; reason?: string };
  const reason = body.reason?.trim();

  if (!body.reportedUserId || !reason) {
    return NextResponse.json({ error: "reportedUserId and reason are required." }, { status: 400 });
  }

  const report = await prisma.meetReport.create({
    data: { reporterUserId: user.id, reportedUserId: body.reportedUserId, reason }
  });

  return NextResponse.json({ report }, { status: 201 });
}

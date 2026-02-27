import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "noir_session_id";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json({ ok: true, deleted: 0 });
    }

    const deleted = await prisma.noirQueue.deleteMany({
      where: {
        sessionId,
        status: "waiting"
      }
    });

    return NextResponse.json({ ok: true, deleted: deleted.count });
  } catch (error) {
    console.error("Failed to leave noir queue", error);
    return NextResponse.json({ error: "Unable to leave queue" }, { status: 500 });
  }
}

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addRealtimeKitParticipant, createRealtimeKitMeeting } from "@/lib/cloudflare-realtimekit";

const SESSION_COOKIE = "noir_session_id";
const STALE_WAITING_MS = 2 * 60 * 1000;
const RANDOM_SAMPLE_SIZE = 20;
const MAX_MATCH_ATTEMPTS = 5;

function normalizeCountryCode(input: unknown) {
  if (typeof input !== "string") return "GLOBAL";
  const value = input.trim().toUpperCase();
  return value.length > 0 ? value : "GLOBAL";
}

async function findRandomWaitingEntry(countryCode: string, sessionId: string) {
  const candidates = await prisma.noirQueue.findMany({
    where: {
      status: "waiting",
      sessionId: { not: sessionId },
      ...(countryCode === "GLOBAL" ? {} : { countryCode })
    },
    orderBy: { createdAt: "asc" },
    take: RANDOM_SAMPLE_SIZE,
    select: { id: true, channel: true }
  });

  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function setSessionCookie(response: NextResponse, request: NextRequest, sessionId: string) {
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/"
    });
  }
  return response;
}

async function createParticipantToken(meetingId: string, sessionId: string) {
  const participant = await addRealtimeKitParticipant({
    meetingId,
    customParticipantId: `noir-${sessionId}-${randomUUID()}`,
    name: "Seenly Noir"
  });
  return participant.token;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as { countryCode?: string };
    const countryCode = normalizeCountryCode(payload.countryCode);
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();
    const staleThreshold = new Date(Date.now() - STALE_WAITING_MS);

    await prisma.noirQueue.deleteMany({
      where: { status: "waiting", createdAt: { lt: staleThreshold } }
    });

    for (let attempt = 0; attempt < MAX_MATCH_ATTEMPTS; attempt += 1) {
      const waiting = await findRandomWaitingEntry(countryCode, sessionId);
      if (!waiting) break;

      const updated = await prisma.noirQueue.updateMany({
        where: { id: waiting.id, status: "waiting" },
        data: { status: "matched" }
      });

      if (updated.count === 1) {
        const authToken = await createParticipantToken(waiting.channel, sessionId);
        return setSessionCookie(NextResponse.json({ meetingId: waiting.channel, authToken, matched: true }), request, sessionId);
      }
    }

    const meeting = await createRealtimeKitMeeting(`Seenly Noir ${countryCode}`);
    const authToken = await createParticipantToken(meeting.id, sessionId);

    await prisma.noirQueue.create({
      data: { channel: meeting.id, countryCode, sessionId, status: "waiting" }
    });

    return setSessionCookie(NextResponse.json({ meetingId: meeting.id, authToken, matched: false }), request, sessionId);
  } catch (error) {
    console.error("Failed to match noir session", error);
    return NextResponse.json({ error: "Unable to find match" }, { status: 500 });
  }
}

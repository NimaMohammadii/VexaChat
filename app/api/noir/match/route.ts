import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "noir_session_id";
const STALE_WAITING_MS = 2 * 60 * 1000;
const RANDOM_SAMPLE_SIZE = 20;
const MAX_MATCH_ATTEMPTS = 5;

function buildChannelName() {
  return `noir-${Math.floor(Math.random() * 1_000_000_000)}`;
}

function normalizeCountryCode(input: unknown) {
  if (typeof input !== "string") {
    return "GLOBAL";
  }

  const value = input.trim().toUpperCase();

  return value.length > 0 ? value : "GLOBAL";
}

async function findRandomWaitingEntry(countryCode: string, sessionId: string) {
  const where = {
    status: "waiting",
    sessionId: {
      not: sessionId
    },
    ...(countryCode === "GLOBAL" ? {} : { countryCode })
  } as const;

  const candidates = await prisma.noirQueue.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: RANDOM_SAMPLE_SIZE,
    select: {
      id: true,
      channel: true
    }
  });

  if (candidates.length === 0) {
    return null;
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  return selected;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as { countryCode?: string };
    const countryCode = normalizeCountryCode(payload.countryCode);
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();
    const staleThreshold = new Date(Date.now() - STALE_WAITING_MS);

    await prisma.noirQueue.deleteMany({
      where: {
        status: "waiting",
        createdAt: {
          lt: staleThreshold
        }
      }
    });

    for (let attempt = 0; attempt < MAX_MATCH_ATTEMPTS; attempt += 1) {
      const waiting = await findRandomWaitingEntry(countryCode, sessionId);

      if (!waiting) {
        break;
      }

      const updated = await prisma.noirQueue.updateMany({
        where: {
          id: waiting.id,
          status: "waiting"
        },
        data: {
          status: "matched"
        }
      });

      if (updated.count === 1) {
        const response = NextResponse.json({ channel: waiting.channel });

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
    }

    const channel = buildChannelName();

    await prisma.noirQueue.create({
      data: {
        channel,
        countryCode,
        sessionId,
        status: "waiting"
      }
    });

    const response = NextResponse.json({ channel });

    if (!request.cookies.get(SESSION_COOKIE)?.value) {
      response.cookies.set(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/"
      });
    }

    return response;
  } catch (error) {
    console.error("Failed to match noir session", error);
    return NextResponse.json({ error: "Unable to find match" }, { status: 500 });
  }
}

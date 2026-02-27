import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function buildChannelName() {
  return `noir-${Math.floor(Math.random() * 1_000_000_000)}`;
}

export async function POST() {
  try {
    const match = await prisma.$transaction(async (tx) => {
      const waiting = await tx.noirQueue.findFirst({
        where: { status: "waiting" },
        orderBy: { createdAt: "asc" }
      });

      if (waiting) {
        const updated = await tx.noirQueue.updateMany({
          where: {
            id: waiting.id,
            status: "waiting"
          },
          data: { status: "matched" }
        });

        if (updated.count === 1) {
          return { channel: waiting.channel };
        }
      }

      const channel = buildChannelName();

      await tx.noirQueue.create({
        data: {
          channel,
          status: "waiting"
        }
      });

      return { channel };
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("Failed to match noir session", error);
    return NextResponse.json({ error: "Unable to find match" }, { status: 500 });
  }
}

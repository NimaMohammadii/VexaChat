import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

type VerificationPayload = {
  requestId?: string;
  docUrls?: unknown;
};

const MAX_DOCS = 3;

function toDocUrls(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_DOCS) {
    return null;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalized.length === 0 || normalized.length !== value.length) {
    return null;
  }

  return normalized;
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latestRequest = await prisma.verificationRequest.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    request: latestRequest
      ? {
        ...latestRequest,
        docUrls: Array.isArray(latestRequest.docUrls) ? latestRequest.docUrls.filter((doc): doc is string => typeof doc === "string") : []
      }
      : null
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as VerificationPayload;
  const docUrls = toDocUrls(body.docUrls);

  if (!docUrls) {
    return NextResponse.json({ error: `docUrls must be an array of 1-${MAX_DOCS} strings.` }, { status: 400 });
  }

  const latestRequest = await prisma.verificationRequest.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  const requestId = body.requestId?.trim();

  try {
    const verificationRequest = latestRequest?.status === "pending"
      ? await prisma.verificationRequest.update({
        where: { id: latestRequest.id },
        data: {
          docUrls,
          note: null
        }
      })
      : await prisma.verificationRequest.create({
        data: {
          id: requestId || undefined,
          userId: user.id,
          status: "pending",
          docUrls
        }
      });

    await prisma.userProfile.updateMany({
      where: { userId: user.id },
      data: {
        identityStatus: verificationRequest.status,
        identityVerified: false
      }
    });

    return NextResponse.json({
      request: {
        ...verificationRequest,
        docUrls: Array.isArray(verificationRequest.docUrls) ? verificationRequest.docUrls.filter((doc): doc is string => typeof doc === "string") : []
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Verification request ID already exists. Try again." }, { status: 400 });
    }

    console.error("Failed to submit verification", error);
    return NextResponse.json({ error: "Unable to submit verification request." }, { status: 500 });
  }
}

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

type MePayload = {
  name?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
};

type ValidatedProfileData = {
  name?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
};

function validateProfileBody(body: MePayload, mode: "full" | "partial") {
  const data: ValidatedProfileData = {};

  if (mode === "full" || body.name !== undefined) {
    const name = body.name?.trim() ?? "";

    if (!name) {
      return { error: "Name is required." };
    }

    data.name = name;
  }

  if (mode === "full" || body.username !== undefined) {
    const username = body.username?.trim().toLowerCase() ?? "";

    if (!username) {
      return { error: "Username is required." };
    }

    data.username = username;
  }

  if (mode === "full" || body.bio !== undefined) {
    data.bio = body.bio?.trim() ?? "";
  }

  if (body.avatarUrl !== undefined) {
    const avatarUrl = body.avatarUrl.trim();

    if (!avatarUrl) {
      return { error: "Avatar URL must be a non-empty string." };
    }

    data.avatarUrl = avatarUrl;
  } else if (mode === "full") {
    data.avatarUrl = "";
  }

  if (mode === "partial" && Object.keys(data).length === 0) {
    return { error: "No profile fields provided." };
  }

  return { data };
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id }
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata.full_name ?? user.user_metadata.name ?? "",
      avatarUrl: user.user_metadata.avatar_url ?? ""
    },
    profile
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as MePayload;
  const validated = validateProfileBody(body, "full");

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: validated.data.name!,
        username: validated.data.username!,
        bio: validated.data.bio!,
        avatarUrl: validated.data.avatarUrl ?? ""
      },
      update: {
        name: validated.data.name!,
        username: validated.data.username!,
        bio: validated.data.bio!,
        avatarUrl: validated.data.avatarUrl ?? ""
      }
    });

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Username is already taken." }, { status: 400 });
    }

    console.error("Failed to upsert user profile", error);
    return NextResponse.json({ error: "Unable to save profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as MePayload;
  const validated = validateProfileBody(body, "partial");

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: validated.data.name ?? user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? "User",
        username: validated.data.username ?? `user-${user.id.slice(0, 8)}`,
        bio: validated.data.bio ?? "",
        avatarUrl: validated.data.avatarUrl ?? ""
      },
      update: validated.data
    });

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Username is already taken." }, { status: 400 });
    }

    console.error("Failed to update user profile", error);
    return NextResponse.json({ error: "Unable to update profile." }, { status: 500 });
  }
}

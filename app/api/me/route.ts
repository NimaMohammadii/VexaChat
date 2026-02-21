import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

type MePayload = {
  name?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
};

function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      }
    }
  });
}

function validateProfileBody(body: MePayload) {
  const name = body.name?.trim() ?? "";
  const username = body.username?.trim().toLowerCase() ?? "";
  const bio = body.bio?.trim() ?? "";
  const avatarUrl = body.avatarUrl?.trim() ?? "";

  if (!name) {
    return { error: "Name is required." };
  }

  if (!username) {
    return { error: "Username is required." };
  }

  return { data: { name, username, bio, avatarUrl } };
}

async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
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
  const validated = validateProfileBody(body);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: validated.data.name,
        username: validated.data.username,
        bio: validated.data.bio,
        avatarUrl: validated.data.avatarUrl
      },
      update: {
        name: validated.data.name,
        username: validated.data.username,
        bio: validated.data.bio,
        avatarUrl: validated.data.avatarUrl
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

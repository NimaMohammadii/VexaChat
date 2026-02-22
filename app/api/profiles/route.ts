import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    age?: number;
    city?: string;
    price?: number;
    description?: string;
    images?: string[];
    height?: string;
    languages?: string[];
    availability?: string;
    verified?: boolean;
    isTop?: boolean;
    experienceYears?: number;
    rating?: number;
    services?: string[];
  };

  const created = await prisma.profile.create({
    data: {
      name: body.name ?? "",
      age: Number(body.age),
      city: body.city ?? "",
      price: Number(body.price),
      description: body.description ?? "",
      images: body.images ?? [],
      height: body.height ?? "",
      languages: body.languages ?? [],
      availability: body.availability ?? "Unavailable",
      verified: Boolean(body.verified),
      isTop: Boolean(body.isTop),
      experienceYears: Number(body.experienceYears ?? 0),
      rating: Number(body.rating ?? 0),
      services: body.services ?? [],
      ownerUserId: user.id
    }
  });

  return NextResponse.json(created, { status: 201 });
}

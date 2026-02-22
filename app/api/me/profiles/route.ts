import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CreateProfilePayload = {
  name?: unknown;
  age?: unknown;
  city?: unknown;
  price?: unknown;
  description?: unknown;
  images?: unknown;
  height?: unknown;
  languages?: unknown;
  availability?: unknown;
  verified?: unknown;
  isTop?: unknown;
  experienceYears?: unknown;
  rating?: unknown;
  services?: unknown;
};

type ValidatedProfileCreateData = {
  name: string;
  age: number;
  city: string;
  price: number;
  description: string;
  images: string[];
  height: string;
  languages: string[];
  availability: string;
  verified: boolean;
  isTop: boolean;
  experienceYears: number;
  rating: number;
  services: string[];
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

async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function validateCreatePayload(body: CreateProfilePayload) {
  const name = readString(body.name);
  const city = readString(body.city);
  const description = readString(body.description);

  if (!name) {
    return { error: "Name is required." };
  }

  if (!city) {
    return { error: "City is required." };
  }

  if (!description) {
    return { error: "Description is required." };
  }

  const age = readNumber(body.age, NaN);
  if (!Number.isInteger(age) || age < 18) {
    return { error: "Age must be an integer and at least 18." };
  }

  const price = readNumber(body.price, NaN);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Price must be a non-negative number." };
  }

  const experienceYears = readNumber(body.experienceYears, 0);
  if (!Number.isFinite(experienceYears) || experienceYears < 0) {
    return { error: "Experience years must be a non-negative number." };
  }

  const rating = readNumber(body.rating, 0);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return { error: "Rating must be between 0 and 5." };
  }

  const data: ValidatedProfileCreateData = {
    name,
    age,
    city,
    price,
    description,
    images: readStringArray(body.images),
    height: readString(body.height),
    languages: readStringArray(body.languages),
    availability: readString(body.availability) || "Unavailable",
    verified: Boolean(body.verified),
    isTop: Boolean(body.isTop),
    experienceYears,
    rating,
    services: readStringArray(body.services)
  };

  return { data };
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await prisma.profile.findMany({
    where: { ownerUserId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateProfilePayload;
  const validated = validateCreatePayload(body);

  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: {
      ...validated.data,
      ownerUserId: user.id
    }
  });

  return NextResponse.json({ profile }, { status: 201 });
}

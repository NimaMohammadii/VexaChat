import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";

function getSafeNextPath(nextValue: string | null) {
  if (!nextValue || !nextValue.startsWith("/")) {
    return "/apply";
  }

  return nextValue;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/?authError=oauth_callback", request.url));
  }

  const { data } = await supabase.auth.getUser();

  if (data.user?.email) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        email: data.user.email,
        name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
        image: data.user.user_metadata?.avatar_url ?? null
      },
      create: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? null,
        image: data.user.user_metadata?.avatar_url ?? null,
        role: "USER",
        kycStatus: "NONE"
      }
    });
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}

import { prisma } from "@/lib/prisma";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function getCurrentAuthUser() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getOrCreateCurrentUserRecord() {
  const authUser = await getCurrentAuthUser();

  if (!authUser?.email) {
    return null;
  }

  return prisma.user.upsert({
    where: { id: authUser.id },
    update: {
      email: authUser.email,
      name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
      image: authUser.user_metadata?.avatar_url ?? null
    },
    create: {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
      image: authUser.user_metadata?.avatar_url ?? null,
      role: "USER",
      kycStatus: "NONE"
    }
  });
}

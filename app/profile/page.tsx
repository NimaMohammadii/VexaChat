import { redirect } from "next/navigation";
import { ProfilePageClient } from "@/components/profile-page-client";
import { createOrUpdateProfileForUser } from "@/lib/profiles";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const defaultName =
    (user.user_metadata.full_name as string | undefined) ??
    (user.user_metadata.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "User";

  const profile = await createOrUpdateProfileForUser(user.id, { name: defaultName });
  const avatarUrl = (user.user_metadata.avatar_url as string | undefined) ?? null;
  const email = user.email ?? "No email";
  const fallback = (profile.name || email).charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <section className="rounded-2xl border border-[#222] bg-[#050505] p-6 md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#333] bg-[#111] text-lg font-semibold">
                {avatarUrl ? <img src={avatarUrl} alt="User avatar" className="h-full w-full object-cover" /> : <span>{fallback}</span>}
              </div>
              <p className="text-sm text-white/80">{email}</p>
            </div>
            <LogoutButton />
          </div>
        </section>

        <ProfilePageClient userId={user.id} initialImageUrl={profile.images[0] ?? null} initialName={profile.name} />
      </div>
    </main>
  );
}

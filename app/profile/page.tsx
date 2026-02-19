import { redirect } from "next/navigation";
import { ProfilePageClient } from "@/components/profile-page-client";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      role: "user"
    },
    {
      onConflict: "id",
      ignoreDuplicates: true
    }
  );

  const { data: profileData } = await supabase
    .from("profiles")
    .select("email, role, image_url")
    .eq("id", user.id)
    .single();

  const avatarUrl = (user.user_metadata.avatar_url as string | undefined) ?? null;
  const email = profileData?.email ?? user.email ?? "No email";
  const role = profileData?.role ?? "user";
  const initialImageUrl = (profileData?.image_url as string | null | undefined) ?? null;
  const fallback = email.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <section className="rounded-2xl border border-[#222] bg-[#050505] p-6 md:p-7">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#333] bg-[#111] text-lg font-semibold">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{fallback}</span>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-white/80">{email}</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full border border-[#333] bg-black px-3 py-1 text-xs uppercase tracking-wide text-white">
                  {role}
                </span>
                {role === "admin" ? (
                  <span className="inline-flex rounded-full border border-[#333] bg-white px-3 py-1 text-xs font-medium text-black">
                    Admin
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <ProfilePageClient userId={user.id} initialImageUrl={initialImageUrl} />
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MyProfilePage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const profile = await prisma.profile.findUnique({
    where: {
      userId: session.user.id
    }
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10">
      <div className="rounded-xl border border-line bg-slate p-6">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="mt-2 text-white/75">Signed in as {session.user.email}</p>

        {profile ? (
          <div className="mt-6 space-y-2">
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>City:</strong> {profile.city}</p>
            <p><strong>Rate:</strong> ${profile.price}/hr</p>
          </div>
        ) : (
          <p className="mt-6 text-white/70">No profile is linked to your account yet.</p>
        )}
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { MeetBrowseStack } from "@/components/meet/meet-browse-stack";

export default async function MeetBrowsePage() {
  const user = await getAuthenticatedUser({ canSetCookies: false });
  if (!user) redirect("/");

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-8">
      <MeetBrowseStack />
    </main>
  );
}

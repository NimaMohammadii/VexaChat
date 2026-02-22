import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase-server";
import { MeetCreateWizard } from "@/components/meet/meet-create-wizard";

export default async function MeetCreatePage() {
  const user = await getAuthenticatedUser({ canSetCookies: false });
  if (!user) redirect("/");

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-10">
      <MeetCreateWizard />
    </main>
  );
}

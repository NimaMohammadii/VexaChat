export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getOrCreateCurrentUserRecord } from "@/lib/current-user";

export default async function CreatorDashboardPage() {
  const user = await getOrCreateCurrentUserRecord();

  if (!user || user.kycStatus !== "APPROVED") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white">
      <div className="mx-auto max-w-2xl bw-card p-8">
        <h1 className="text-3xl font-bold">Creator Dashboard</h1>
        <p className="mt-3 text-gray-400">Welcome back. Your creator account is approved.</p>
      </div>
    </main>
  );
}

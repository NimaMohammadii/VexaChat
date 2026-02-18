export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { CreatorApplicationForm } from "@/components/creator-application-form";
import { GoogleLoginButton } from "@/components/google-login-button";
import { getOrCreateCurrentUserRecord } from "@/lib/current-user";

export default async function ApplyPage() {
  const user = await getOrCreateCurrentUserRecord();

  if (!user) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <div className="mx-auto max-w-xl space-y-6 text-center bw-card p-8">
          <h1 className="text-3xl font-bold">Become a Creator</h1>
          <p className="text-sm text-gray-400">Sign in with Google to submit your application.</p>
          <GoogleLoginButton />
        </div>
      </main>
    );
  }

  if (user.kycStatus === "APPROVED") {
    redirect("/creator/dashboard");
  }

  if (user.kycStatus === "PENDING") {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <div className="mx-auto max-w-xl bw-card p-8 text-center">
          <h1 className="text-2xl font-semibold">Application Submitted</h1>
          <p className="mt-3 text-sm text-gray-400">Your application is pending admin review.</p>
        </div>
      </main>
    );
  }

  if (user.kycStatus === "REJECTED") {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <div className="mx-auto max-w-xl bw-card p-8 text-center">
          <h1 className="text-2xl font-semibold">Application Rejected</h1>
          <p className="mt-3 text-sm text-gray-400">Your application was rejected. Please contact support.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <CreatorApplicationForm />
      </div>
    </main>
  );
}

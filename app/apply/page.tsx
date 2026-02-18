import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { CreatorApplicationForm } from "@/components/creator-application-form";

export default async function ApplyPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <div className="mx-auto max-w-xl space-y-6 text-center bw-card p-8">
          <h1 className="text-3xl font-bold">Become a Creator</h1>
          <p className="text-sm text-gray-400">Sign in with Google to submit your application.</p>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/apply" });
            }}
          >
            <button className="bw-button w-full">Continue with Google</button>
          </form>
        </div>
      </main>
    );
  }

  if (session.user.kycStatus === "APPROVED") {
    redirect("/creator/dashboard");
  }

  if (session.user.kycStatus === "PENDING") {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <div className="mx-auto max-w-xl bw-card p-8 text-center">
          <h1 className="text-2xl font-semibold">Application Submitted</h1>
          <p className="mt-3 text-sm text-gray-400">Your application is under review. We will notify you once approved.</p>
        </div>
      </main>
    );
  }

  if (session.user.kycStatus === "REJECTED") {
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

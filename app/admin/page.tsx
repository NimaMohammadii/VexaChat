import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [profiles, applications] = await Promise.all([
    prisma.profile.findMany(),
    prisma.creatorProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="bw-card p-6">
        <p className="text-sm text-gray-400">Total Profiles</p>
        <p className="mt-2 text-5xl font-semibold">{profiles.length}</p>
      </div>

      <section className="bw-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Creator Applications</h2>
          <span className="text-sm text-gray-400">{applications.length} total</span>
        </div>
        <div className="space-y-4">
          {applications.map((application) => {
            const status = application.user.kycStatus;
            const badgeClass =
              status === "APPROVED"
                ? "border-gray-300 text-white"
                : status === "REJECTED"
                  ? "border-gray-700 text-gray-300"
                  : "border-gray-600 text-gray-200";

            return (
              <article key={application.id} className="rounded-xl border border-gray-800 bg-[#070707] p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="space-y-1">
                    <p className="text-lg font-medium">{application.displayName}</p>
                    <p className="text-sm text-gray-400">{application.user.email}</p>
                    <p className="text-sm text-gray-400">
                      {application.city} · ${application.price}/month
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs tracking-wide ${badgeClass}`}>
                    {status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">ID Card</p>
                    <Image
                      src={`/api/admin/kyc-files/${application.id}/id-card`}
                      alt="ID card preview"
                      width={500}
                      height={320}
                      className="h-48 w-full rounded-lg border border-gray-800 object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Selfie With ID</p>
                    <Image
                      src={`/api/admin/kyc-files/${application.id}/selfie`}
                      alt="Selfie with ID preview"
                      width={500}
                      height={320}
                      className="h-48 w-full rounded-lg border border-gray-800 object-cover"
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <form action={`/api/admin/creator-applications/${application.id}/approve`} method="POST">
                    <button className="bw-button" type="submit">
                      ✔ Approve
                    </button>
                  </form>
                  <form action={`/api/admin/creator-applications/${application.id}/reject`} method="POST">
                    <button className="bw-button-muted" type="submit">
                      ❌ Reject
                    </button>
                  </form>
                </div>
              </article>
            );
          })}

          {applications.length === 0 ? <p className="text-sm text-gray-400">No creator applications yet.</p> : null}
        </div>
      </section>
    </section>
  );
}

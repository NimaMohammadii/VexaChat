import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminProfilesPage() {
  const profiles = await prisma.profile.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profiles</h1>
        <Link className="bw-button" href="/admin/profiles/new">
          New profile
        </Link>
      </div>
      <div className="space-y-2">
        {profiles.map((profile) => (
          <Link key={profile.id} href={`/admin/profiles/${profile.id}/edit`} className="block rounded-lg border border-line p-3">
            {profile.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

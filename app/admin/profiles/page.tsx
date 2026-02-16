import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminProfilesPage() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Profiles</h1>
      <div className="space-y-3">
        {profiles.map((profile) => (
          <article key={profile.id} className="bw-card flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-line">
                {profile.images[0] ? (
                  <Image
                    src={profile.images[0]}
                    alt={profile.name}
                    fill
                    unoptimized={profile.images[0].startsWith("data:")}
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div>
                <p className="font-medium">{profile.name}</p>
                <p className="text-sm text-white/70">
                  {profile.city} · ${profile.price}/hr
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/profiles/${profile.id}/edit`} className="bw-button-muted">
                Edit
              </Link>
              <form action={`/api/profiles/${profile.id}`} method="post">
                <input type="hidden" name="_method" value="DELETE" />
                <button className="bw-button-muted" formMethod="post">
                  Delete
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import Image from "next/image";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const profile = await prisma.profile.findUnique({ where: { id: params.id } });
  if (!profile) {
    return { title: "Profile not found" };
  }

  const image = profile.images[0] || profile.imageUrl || undefined;
  const description = `${profile.name} in ${profile.city}. ${profile.description.slice(0, 120)}`;

  return {
    title: `${profile.name} · ${profile.city}`,
    description,
    openGraph: {
      title: `${profile.name} · ${profile.city}`,
      description,
      images: image ? [image] : undefined
    }
  };
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const profile = await prisma.profile.findUnique({ where: { id: params.id } });

  if (!profile || !profile.verified) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-semibold">{profile.name}</h1>
      <p className="text-white/70">{profile.city} · ${profile.price}/hr</p>
      <div className="grid gap-3 md:grid-cols-3">
        {(profile.images.length ? profile.images : [profile.imageUrl]).filter(Boolean).map((image) => (
          <div key={image} className="relative h-80 overflow-hidden rounded-xl border border-line">
            <Image src={image} alt={profile.name} fill className="object-cover" />
          </div>
        ))}
      </div>
      <div className="bw-card p-6">
        <p className="text-sm text-white/70">{profile.description}</p>
        <p className="mt-3 text-sm">Languages: {profile.languages.join(", ") || "—"}</p>
        <p className="text-sm">Services: {profile.services.join(", ") || "—"}</p>
        {profile.verified ? <p className="mt-2 inline-flex rounded-full border border-emerald-400/60 px-3 py-1 text-xs text-emerald-300">Verified</p> : null}
      </div>
      <button type="button" className="bw-button">Contact</button>
    </main>
  );
}

import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const profile = await prisma.profile.findUnique({
    where: { id: params.id }
  });

  if (!profile) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-8 px-4 py-8">
      <section className="grid gap-4 md:grid-cols-2">
        {profile.images.map((img, index) => (
          <div key={`${profile.id}-${index}`} className="relative h-80 overflow-hidden rounded-xl border border-line bg-slate">
            <Image src={img} alt={`${profile.name} ${index + 1}`} fill unoptimized className="object-cover" />
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-slate p-6">
        <h1 className="text-4xl font-bold tracking-tight">{profile.name}</h1>
        <p className="text-lg text-white/80">
          {profile.city} · ${profile.price}/hr
        </p>
        <p className="max-w-3xl leading-relaxed text-white/85">{profile.description}</p>
      </section>
    </main>
  );
}

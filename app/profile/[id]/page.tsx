import Image from "next/image";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/profile-store";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const profile = getProfile(params.id);

  if (!profile) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-8 px-4 py-8">
      <section className="grid gap-4 md:grid-cols-2">
        {profile.images.map((image, index) => (
          <div key={`${profile.id}-${index}`} className="relative h-80 overflow-hidden rounded-xl border border-line bg-slate">
            <Image src={image} alt={`${profile.name} ${index + 1}`} fill className="object-cover" />
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-slate p-6">
        <h1 className="text-4xl font-bold tracking-tight">{profile.name}</h1>
        <p className="text-lg text-white/80">
          {profile.city} · {profile.price}
        </p>
        <p className="max-w-3xl leading-relaxed text-white/85">{profile.description}</p>
        <div>
          <h2 className="mb-3 text-sm uppercase tracking-[0.2em] text-white/70">Services</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {profile.services.map((service) => (
              <li key={service} className="rounded-lg border border-line px-4 py-2 text-sm">
                {service}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

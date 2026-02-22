import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function StarRating({ rating }: { rating: number }) {
  const normalized = Math.max(0, Math.min(5, rating));

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 text-xl leading-none text-paper" aria-label={`Rated ${normalized.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.max(0, Math.min(1, normalized - index));

          return (
            <span
              key={`star-${index}`}
              className="relative inline-block text-white/20"
              aria-hidden
            >
              ★
              <span className="absolute left-0 top-0 overflow-hidden text-paper" style={{ width: `${fill * 100}%` }}>
                ★
              </span>
            </span>
          );
        })}
      </div>
      <span className="text-sm text-white/75">{normalized.toFixed(1)} / 5.0</span>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const profile = await prisma.profile.findUnique({
    where: { id: params.id }
  });

  if (!profile) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-8 px-4 py-8 md:space-y-10 md:py-10">
      <section className="grid gap-6 rounded-2xl border border-line bg-slate p-5 md:grid-cols-[1.1fr_1fr] md:gap-8 md:p-8">
        <div className="relative h-[500px] overflow-hidden rounded-xl border border-line bg-black">
          {(profile.imageUrl || profile.images[0]) ? (
            <Image src={profile.imageUrl || profile.images[0]} alt={profile.name} fill className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/40">No image available</div>
          )}
        </div>

        <div className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
              <span>Profile</span>
              {profile.verified ? (
                <span className="rounded-full border border-paper px-2.5 py-1 text-[10px] text-paper">Verified</span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{profile.name}</h1>
              <p className="text-base text-white/80">{profile.age} years · {profile.city}</p>
              <p className="text-2xl font-medium text-paper">${profile.price}/hr</p>
            </div>

            <p className="inline-flex w-fit rounded-full border border-line px-3 py-1 text-xs text-white/75">
              {profile.availability}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">Rating</p>
            <div className="mt-2">
              <StarRating rating={profile.rating} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-line bg-slate p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-white/50">Height</p>
          <p className="mt-2 text-lg">{profile.height || "—"}</p>
        </article>
        <article className="rounded-xl border border-line bg-slate p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-white/50">Languages</p>
          <p className="mt-2 text-lg">{profile.languages.length ? profile.languages.join(", ") : "—"}</p>
        </article>
        <article className="rounded-xl border border-line bg-slate p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-white/50">Availability</p>
          <p className="mt-2 text-lg">{profile.availability}</p>
        </article>
        <article className="rounded-xl border border-line bg-slate p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-white/50">Experience</p>
          <p className="mt-2 text-lg">{profile.experienceYears} years</p>
        </article>
      </section>

      <section className="rounded-xl border border-line bg-slate p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">About</p>
        <p className="mt-4 max-w-4xl text-base leading-relaxed text-white/85 md:text-lg">
          {profile.description}
        </p>
      </section>

      <section className="rounded-xl border border-line bg-slate p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">Services</p>
        {profile.services.length ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-white/85 marker:text-white/70">
            {profile.services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-white/70">Service details will be shared privately.</p>
        )}
      </section>

      <section className="rounded-2xl border border-paper/70 bg-slate p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Booking</p>
            <h2 className="mt-2 text-2xl font-medium tracking-tight">Reserve a private introduction</h2>
            <p className="mt-2 text-sm text-white/70">Choose your preferred channel and receive a response discreetly.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="bw-button">Request Booking</button>
            <button type="button" className="bw-button-muted">Send Message</button>
          </div>
        </div>
      </section>
    </main>
  );
}

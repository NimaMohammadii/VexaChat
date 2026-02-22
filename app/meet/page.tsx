import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/supabase-server";

export default async function MeetPage() {
  const user = await getAuthenticatedUser({ canSetCookies: false });
  if (!user) redirect("/");

  const card = await prisma.meetCard.findUnique({ where: { userId: user.id } });

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Meet</h1>
        <Link href="/me" className="bw-button-muted">My Profile</Link>
      </div>

      <section className="bw-card space-y-3 p-6">
        <p className="text-sm text-white/70">Step 1: Create your 18+ Meet card.</p>
        <p className="text-sm text-white/70">Step 2: Browse cards with swipe actions.</p>
      </section>

      {card ? (
        <section className="bw-card space-y-3 p-6">
          <h2 className="text-xl font-semibold">Your card is ready</h2>
          <p className="text-sm text-white/70">{card.displayName}, {card.age} · {card.city}</p>
          <div className="flex gap-3">
            <Link href="/meet/create" className="bw-button-muted">Edit card</Link>
            <Link href="/meet/browse" className="bw-button">Start browsing</Link>
          </div>
        </section>
      ) : (
        <section className="bw-card space-y-3 p-6">
          <h2 className="text-xl font-semibold">Create your Meet card</h2>
          <p className="text-sm text-white/70">18+ confirmation is required before browsing.</p>
          <Link href="/meet/create" className="bw-button">Create your card</Link>
        </section>
      )}
    </main>
  );
}

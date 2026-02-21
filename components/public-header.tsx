import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export async function PublicHeader() {
  const session = await auth();

  return (
    <header className="border-b border-line">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-6">
        <p className="text-sm tracking-[0.2em]">VEXA</p>
        <div className="w-full max-w-2xl justify-self-center rounded-xl border border-line bg-slate px-4 py-3">
          <input
            aria-label="Search profiles"
            placeholder="Search by name, city, service..."
            className="w-full bg-transparent text-sm text-paper outline-none placeholder:text-white/50"
          />
        </div>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/profile" className="bw-button-muted">My profile</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="bw-button-muted">Sign in</Link>
              <Link href="/sign-up" className="bw-button">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

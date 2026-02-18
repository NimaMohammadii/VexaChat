import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export async function PublicHeader() {
  const session = await auth();

  return (
    <header className="border-b border-gray-800 bg-black/90 backdrop-blur">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-6">
        <Link href="/" className="text-sm font-semibold tracking-[0.3em]">
          VEXA
        </Link>
        <div className="w-full max-w-2xl justify-self-center rounded-xl border border-gray-800 bg-[#080808] px-4 py-3">
          <input
            aria-label="Search profiles"
            placeholder="Search by name, city"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <Link href="/apply" className="bw-button-muted">
            Apply
          </Link>
          {session?.user ? (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button className="bw-button">Sign out</button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/apply" });
              }}
            >
              <button className="bw-button">Google Login</button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { GoogleAuthControl } from "@/components/google-auth-control";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type HeaderUser = {
  email: string | null;
  avatarUrl: string | null;
};

function SearchBar() {
  return (
    <div className="w-full rounded-xl border border-line bg-slate px-4 py-3">
      <input
        aria-label="Search profiles"
        placeholder="Search by name, city, service..."
        className="w-full bg-transparent text-sm text-paper outline-none placeholder:text-white/50"
      />
    </div>
  );
}

function UserAvatar({ user }: { user: HeaderUser }) {
  const fallback = user.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <Link
      href="/profile"
      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#333] bg-[#111] text-sm font-medium text-white transition hover:border-white"
      aria-label="Go to profile"
    >
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
      ) : (
        <span>{fallback}</span>
      )}
    </Link>
  );
}

export async function PublicHeader() {
  let user: HeaderUser | null = null;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();

    if (currentUser) {
      user = {
        email: currentUser.email ?? null,
        avatarUrl: (currentUser.user_metadata.avatar_url as string | undefined) ?? null
      };
    }
  } catch (error) {
    console.error("Failed to load auth user", error);
  }

  return (
    <header className="border-b border-line">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="flex items-center gap-4">
          <p className="text-sm tracking-[0.2em]">VEXA</p>

          <div className="flex min-w-0 flex-1 items-center gap-6">
            <div className="min-w-0 flex-1">
              <SearchBar />
            </div>

            <div className="flex-shrink-0">{user ? <UserAvatar user={user} /> : <GoogleAuthControl />}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

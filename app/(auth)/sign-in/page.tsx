"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message || "Sign in failed.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <form onSubmit={onSubmit} className="w-full space-y-4 rounded-xl border border-line bg-slate p-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>

        <input
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-md border border-line bg-ink px-3 py-2"
        />

        <input
          name="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-md border border-line bg-ink px-3 py-2"
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button type="submit" disabled={loading} className="bw-button w-full disabled:opacity-60">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}

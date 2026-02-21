"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MeProfileForm } from "@/components/me-profile-form";

type MeData = {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  };
  profile: {
    name: string;
    username: string;
    bio: string;
    avatarUrl: string;
  } | null;
};

export default function MePage() {
  const [data, setData] = useState<MeData | null>(null);
  const [status, setStatus] = useState<"loading" | "unauthorized" | "error" | "ready">("loading");

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/me", { cache: "no-store" }).catch(() => null);

      if (!response || response.status === 401) {
        setStatus("unauthorized");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const payload = (await response.json()) as MeData;
      setData(payload);
      setStatus("ready");
    };

    void load();
  }, []);

  if (status === "loading") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <p className="text-sm text-white/70">Loading profile...</p>
      </main>
    );
  }

  if (status === "unauthorized") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <div className="bw-card w-full max-w-lg space-y-4 p-8 text-center">
          <h1 className="text-2xl font-semibold">You are not signed in</h1>
          <p className="text-sm text-white/70">Please sign in with Google to access your profile settings.</p>
          <Link href="/" className="bw-button mx-auto">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (status === "error" || !data) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <div className="bw-card w-full max-w-lg space-y-4 p-8 text-center">
          <h1 className="text-2xl font-semibold">Profile unavailable</h1>
          <p className="text-sm text-white/70">We could not load your profile right now. Please try again soon.</p>
          <Link href="/" className="bw-button mx-auto">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <Link href="/" className="bw-button-muted">
          Home
        </Link>
      </div>
      <MeProfileForm data={data} />
    </main>
  );
}

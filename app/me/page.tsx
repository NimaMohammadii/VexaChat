"use client";

import Image from "next/image";
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

type OwnedProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  price: number;
  verified: boolean;
  imageUrl: string;
  images: string[];
  createdAt: string;
};

export default function MePage() {
  const [data, setData] = useState<MeData | null>(null);
  const [status, setStatus] = useState<"loading" | "unauthorized" | "error" | "ready">("loading");
  const [myProfiles, setMyProfiles] = useState<OwnedProfile[]>([]);

  const loadMyProfiles = async () => {
    const response = await fetch("/api/me/profiles", { cache: "no-store" }).catch(() => null);

    if (!response || response.status === 401 || !response.ok) {
      setMyProfiles([]);
      return;
    }

    const payload = (await response.json()) as { profiles: OwnedProfile[] };
    setMyProfiles(payload.profiles);
  };

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
      void loadMyProfiles();
    };

    void load();
  }, []);

  if (status !== "ready" || !data) {
    return <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10"><p className="text-sm text-white/70">{status === "loading" ? "Loading profile..." : "Please sign in to continue."}</p></main>;
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <Link href="/" className="bw-button-muted">Home</Link>
      </div>

      <MeProfileForm data={data} />

      <Link href="/me/create-profile" className="bw-card block rounded-2xl border border-dashed border-paper/30 p-6 transition hover:border-paper/70 hover:bg-white/5 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Home Profiles</p>
        <h2 className="mt-2 text-xl font-semibold">Create a Profile</h2>
        <p className="mt-2 text-sm text-white/70">Start the submission flow. Your profile stays pending until an admin verifies it.</p>
        <span className="mt-4 inline-flex rounded-lg border border-line px-3 py-2 text-sm">Open create flow →</span>
      </Link>

      <section className="bw-card space-y-4 p-6 md:p-8">
        <h2 className="text-xl font-semibold">My Profiles</h2>
        {myProfiles.length === 0 ? <p className="text-sm text-white/70">You have not created any profiles yet.</p> : null}
        <ul className="space-y-3">
          {myProfiles.map((profile) => {
            const previewImage = profile.imageUrl || profile.images[0] || "";
            return (
              <li key={profile.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-line bg-black/30">
                    {previewImage ? <Image src={previewImage} alt={profile.name} fill className="object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{profile.name}</p>
                    <p className="text-sm text-white/70">{profile.city} · ${profile.price}/hr</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${profile.verified ? "border border-emerald-400/60 text-emerald-300" : "border border-amber-400/60 text-amber-300"}`}>
                    {profile.verified ? "Verified" : "Pending verification"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

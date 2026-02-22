"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type AdminProfile = {
  id: string;
  name: string;
  city: string;
  price: number;
  verified: boolean;
  ownerUserId: string | null;
  imageUrl: string;
  images: string[];
  createdAt: string;
};

export default function AdminDashboardPage() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [status, setStatus] = useState<"loading" | "forbidden" | "ready" | "error">("loading");

  const loadProfiles = async () => {
    setStatus("loading");
    const response = await fetch("/api/admin/profiles", { cache: "no-store" }).catch(() => null);

    if (!response) {
      setStatus("error");
      return;
    }

    if (response.status === 403) {
      setStatus("forbidden");
      return;
    }

    if (!response.ok) {
      setStatus("error");
      return;
    }

    const payload = (await response.json()) as { profiles: AdminProfile[] };
    setProfiles(payload.profiles);
    setStatus("ready");
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  const onToggleVerify = async (id: string, action: "verify" | "unverify") => {
    const response = await fetch(`/api/admin/profiles/${id}/${action}`, { method: "POST" });

    if (response.ok) {
      void loadProfiles();
    }
  };

  if (status === "loading") {
    return <p className="text-sm text-white/70">Loading admin profiles…</p>;
  }

  if (status === "forbidden") {
    return <p className="text-sm text-red-300">Forbidden. Configure ADMIN_EMAILS or ADMIN_USER_IDS and sign in as an admin.</p>;
  }

  if (status === "error") {
    return <p className="text-sm text-red-300">Unable to load admin profiles right now.</p>;
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Admin Verification Panel</h1>
      <div className="space-y-3">
        {profiles.map((profile) => {
          const previewImage = profile.imageUrl || profile.images[0] || "";
          return (
            <article key={profile.id} className="bw-card flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-line bg-black/40">
                  {previewImage ? <Image src={previewImage} alt={profile.name} fill className="object-cover" /> : null}
                </div>
                <div>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-white/70">{profile.city} · ${profile.price}/hr · owner {profile.ownerUserId ?? "legacy"}</p>
                  <p className="mt-1 text-xs text-white/55">{new Date(profile.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs ${profile.verified ? "border border-emerald-400/60 text-emerald-300" : "border border-amber-400/60 text-amber-300"}`}>
                  {profile.verified ? "Verified" : "Pending"}
                </span>
                {profile.verified ? (
                  <button className="bw-button-muted" onClick={() => onToggleVerify(profile.id, "unverify")}>Unverify</button>
                ) : (
                  <button className="bw-button" onClick={() => onToggleVerify(profile.id, "verify")}>Verify</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

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
    identityVerified?: boolean;
    identityStatus?: string;
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

type VerificationRequest = {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  docUrls: string[];
  note: string | null;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusLabel: Record<string, string> = {
  none: "Not submitted",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

export default function MePage() {
  const [data, setData] = useState<MeData | null>(null);
  const [status, setStatus] = useState<"loading" | "unauthorized" | "error" | "ready">("loading");
  const [myProfiles, setMyProfiles] = useState<OwnedProfile[]>([]);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [favorites, setFavorites] = useState<OwnedProfile[]>([]);

  const loadMyProfiles = async () => {
    const response = await fetch("/api/me/profiles", { cache: "no-store" }).catch(() => null);

    if (!response || response.status === 401 || !response.ok) {
      setMyProfiles([]);
      return;
    }

    const payload = (await response.json()) as { profiles: OwnedProfile[] };
    setMyProfiles(payload.profiles);
  };


  const loadFavorites = async () => {
    const response = await fetch("/api/me/favorites", { cache: "no-store" }).catch(() => null);
    if (!response || !response.ok) {
      setFavorites([]);
      return;
    }
    const payload = (await response.json()) as { favorites: Array<{ profile: OwnedProfile }> };
    setFavorites(payload.favorites.map((item) => item.profile));
  };

  const loadVerification = async () => {
    const response = await fetch("/api/me/verification", { cache: "no-store" }).catch(() => null);
    if (!response || response.status === 401 || !response.ok) {
      setVerificationRequest(null);
      return;
    }

    const payload = (await response.json()) as { request: VerificationRequest | null };
    setVerificationRequest(payload.request);
  };

  const onDeleteProfile = async (profile: OwnedProfile) => {
    const shouldDelete = window.confirm(`Delete ${profile.name}? This also removes all uploaded profile images.`);
    if (!shouldDelete) {
      return;
    }

    setDeletingId(profile.id);
    setActionStatus(null);

    const response = await fetch(`/api/me/profiles/${profile.id}`, {
      method: "DELETE"
    }).catch(() => null);

    if (!response || !response.ok) {
      const payload = response ? ((await response.json()) as { error?: string }) : null;
      setActionStatus(payload?.error ?? "Unable to delete this profile right now.");
      setDeletingId(null);
      return;
    }

    setActionStatus("Profile deleted.");
    setDeletingId(null);
    await loadMyProfiles();
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
      void loadVerification();
      void loadFavorites();
    };

    void load();
  }, []);

  if (status !== "ready" || !data) {
    return <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10"><div className="animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-white/10" /><div className="h-40 rounded bg-white/10" /><div className="h-24 rounded bg-white/10" /></div></main>;
  }

  const hasProfile = myProfiles.length > 0;
  const currentVerificationStatus = verificationRequest?.status ?? data.profile?.identityStatus ?? "none";

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <Link href="/" className="bw-button-muted">Home</Link>
      </div>

      <MeProfileForm data={data} />

      <Link href="/me/verification" className="bw-card block space-y-4 p-6 transition hover:border-white/30 hover:bg-white/5 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Identity Verification</h2>
          <span className={`rounded-full px-3 py-1 text-xs ${
            currentVerificationStatus === "approved"
              ? "border border-emerald-400/60 text-emerald-300"
              : currentVerificationStatus === "rejected"
                ? "border border-red-400/60 text-red-300"
                : currentVerificationStatus === "pending"
                  ? "border border-amber-400/60 text-amber-300"
                  : "border border-line text-white/70"
          }`}>
            {statusLabel[currentVerificationStatus] ?? "Not submitted"}
          </span>
        </div>

        <p className="text-sm text-white/70">Start or review your verification submission in a guided flow.</p>
        {(verificationRequest?.adminNote || verificationRequest?.note) ? <p className="text-sm text-white/60">Admin note: {verificationRequest?.adminNote || verificationRequest?.note}</p> : null}
        {currentVerificationStatus === "rejected" ? <span className="inline-flex rounded-lg border border-red-400/60 px-3 py-2 text-sm text-red-300">Resubmit available</span> : null}
        <span className="inline-flex rounded-lg border border-line px-3 py-2 text-sm">Open verification wizard →</span>
      </Link>

      {hasProfile ? (
        <section className="bw-card rounded-2xl border border-dashed border-line/80 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Home Profiles</p>
          <p className="mt-2 text-sm text-amber-300">You already have one profile. Only one profile is allowed per account.</p>
        </section>
      ) : (
        <Link href="/me/create-profile" className="bw-card block rounded-2xl border border-dashed border-paper/30 p-6 transition hover:border-paper/70 hover:bg-white/5 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Home Profiles</p>
          <h2 className="mt-2 text-xl font-semibold">Create a Profile</h2>
          <p className="mt-2 text-sm text-white/70">Start the submission flow. Your profile stays pending until an admin verifies it.</p>
          <span className="mt-4 inline-flex rounded-lg border border-line px-3 py-2 text-sm">Open create flow →</span>
        </Link>
      )}

      <section className="bw-card space-y-4 p-6 md:p-8">
        <h2 className="text-xl font-semibold">My Profiles</h2>
        {myProfiles.length === 0 ? <p className="text-sm text-white/70">You have not created any profiles yet.</p> : null}
        {actionStatus ? <p className="text-sm text-white/70">{actionStatus}</p> : null}
        <ul className="space-y-3">
          {myProfiles.map((profile) => {
            const previewImage = profile.images[0] || profile.imageUrl || "";
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
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs ${profile.verified ? "border border-emerald-400/60 text-emerald-300" : "border border-amber-400/60 text-amber-300"}`}>
                      {profile.verified ? "Verified" : "Pending verification"}
                    </span>
                    <Link
                      href="/me/profile/edit"
                      aria-label={`Edit ${profile.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line/80 text-sm text-white/70 transition hover:border-white/50 hover:text-white"
                    >
                      ✎
                    </Link>
                    <button
                      type="button"
                      aria-label={`Delete ${profile.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line/80 text-sm text-white/70 transition hover:border-red-400/70 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => onDeleteProfile(profile)}
                      disabled={deletingId === profile.id}
                    >
                      {deletingId === profile.id ? "…" : "✕"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>


      <section className="bw-card space-y-4 p-6 md:p-8">
        <h2 className="text-xl font-semibold">Favorites</h2>
        {favorites.length === 0 ? <p className="text-sm text-white/70">No favorites yet.</p> : null}
        <ul className="space-y-2">{favorites.map((fav) => <li key={fav.id} className="text-sm text-white/80">{fav.name} · {fav.city}</li>)}</ul>
      </section>
    </main>
  );
}

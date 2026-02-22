"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
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
  createdAt: string;
};

type CreateListingForm = {
  name: string;
  age: string;
  city: string;
  price: string;
  description: string;
  imageUrl: string;
  height: string;
  availability: string;
  experienceYears: string;
  rating: string;
  languages: string;
  services: string;
};

const INITIAL_FORM: CreateListingForm = {
  name: "",
  age: "18",
  city: "",
  price: "0",
  description: "",
  imageUrl: "",
  height: "",
  availability: "Available",
  experienceYears: "0",
  rating: "0",
  languages: "",
  services: ""
};

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function MePage() {
  const [data, setData] = useState<MeData | null>(null);
  const [status, setStatus] = useState<"loading" | "unauthorized" | "error" | "ready">("loading");
  const [myProfiles, setMyProfiles] = useState<OwnedProfile[]>([]);
  const [listingForm, setListingForm] = useState<CreateListingForm>(INITIAL_FORM);
  const [listingStatus, setListingStatus] = useState<string | null>(null);
  const [listingSuccess, setListingSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const onCreateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setListingStatus(null);
    setListingSuccess(false);

    const response = await fetch("/api/me/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: listingForm.name,
        age: Number(listingForm.age),
        city: listingForm.city,
        price: Number(listingForm.price),
        description: listingForm.description,
        images: listingForm.imageUrl ? [listingForm.imageUrl] : [],
        height: listingForm.height,
        availability: listingForm.availability,
        experienceYears: Number(listingForm.experienceYears),
        rating: Number(listingForm.rating),
        languages: splitCommaSeparated(listingForm.languages),
        services: splitCommaSeparated(listingForm.services)
      })
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setListingStatus(payload.error ?? "Unable to create profile.");
      setIsCreating(false);
      return;
    }

    setListingSuccess(true);
    setListingStatus("Profile created successfully.");
    setListingForm(INITIAL_FORM);
    setIsCreating(false);
    void loadMyProfiles();
  };

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
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <Link href="/" className="bw-button-muted">
          Home
        </Link>
      </div>
      <MeProfileForm data={data} />

      <section className="bw-card space-y-4 p-6 md:p-8">
        <h2 className="text-xl font-semibold">Create a Profile</h2>
        <form className="space-y-3" onSubmit={onCreateListing}>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="bw-input" placeholder="Name" value={listingForm.name} onChange={(e) => setListingForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="bw-input" type="number" min={18} placeholder="Age" value={listingForm.age} onChange={(e) => setListingForm((p) => ({ ...p, age: e.target.value }))} required />
            <input className="bw-input" placeholder="City" value={listingForm.city} onChange={(e) => setListingForm((p) => ({ ...p, city: e.target.value }))} required />
            <input className="bw-input" type="number" min={0} placeholder="Price" value={listingForm.price} onChange={(e) => setListingForm((p) => ({ ...p, price: e.target.value }))} required />
            <input className="bw-input" placeholder="Primary image URL" value={listingForm.imageUrl} onChange={(e) => setListingForm((p) => ({ ...p, imageUrl: e.target.value }))} />
            <input className="bw-input" placeholder="Height" value={listingForm.height} onChange={(e) => setListingForm((p) => ({ ...p, height: e.target.value }))} />
            <input className="bw-input" placeholder="Availability" value={listingForm.availability} onChange={(e) => setListingForm((p) => ({ ...p, availability: e.target.value }))} />
            <input className="bw-input" type="number" min={0} placeholder="Experience years" value={listingForm.experienceYears} onChange={(e) => setListingForm((p) => ({ ...p, experienceYears: e.target.value }))} />
            <input className="bw-input" type="number" min={0} max={5} step={0.1} placeholder="Rating" value={listingForm.rating} onChange={(e) => setListingForm((p) => ({ ...p, rating: e.target.value }))} />
            <input className="bw-input" placeholder="Languages (comma separated)" value={listingForm.languages} onChange={(e) => setListingForm((p) => ({ ...p, languages: e.target.value }))} />
          </div>
          <input className="bw-input" placeholder="Services (comma separated)" value={listingForm.services} onChange={(e) => setListingForm((p) => ({ ...p, services: e.target.value }))} />
          <textarea className="bw-input min-h-28" placeholder="Description" value={listingForm.description} onChange={(e) => setListingForm((p) => ({ ...p, description: e.target.value }))} required />
          <div className="flex items-center gap-3">
            <button type="submit" className="bw-button" disabled={isCreating}>{isCreating ? "Creating..." : "Create Listing"}</button>
            {listingSuccess ? (
              <Link href="/" className="bw-button-muted">
                View on Home
              </Link>
            ) : null}
          </div>
          <p className="text-sm text-white/70">{listingStatus ?? ""}</p>
        </form>
      </section>

      <section className="bw-card space-y-4 p-6 md:p-8">
        <h2 className="text-xl font-semibold">My Profiles</h2>
        {myProfiles.length === 0 ? <p className="text-sm text-white/70">You have not created any profiles yet.</p> : null}
        <ul className="space-y-2">
          {myProfiles.map((profile) => (
            <li key={profile.id} className="rounded-lg border border-line px-3 py-2 text-sm">
              <span className="font-semibold">{profile.name}</span> · {profile.city} · ${profile.price}/hr
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

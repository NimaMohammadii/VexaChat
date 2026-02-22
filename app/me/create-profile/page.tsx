"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

type CreateListingForm = {
  name: string;
  age: string;
  city: string;
  price: string;
  description: string;
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
  height: "",
  availability: "Available",
  experienceYears: "0",
  rating: "0",
  languages: "",
  services: ""
};

function splitCommaSeparated(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function CreateProfilePage() {
  const [listingForm, setListingForm] = useState<CreateListingForm>(INITIAL_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState<boolean | null>(null);
  const [draftProfileId, setDraftProfileId] = useState(() => crypto.randomUUID());
  const deviceFileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const checkExistingProfile = async () => {
      const response = await fetch("/api/me/profiles", { cache: "no-store" }).catch(() => null);
      if (!response || !response.ok) {
        setHasExistingProfile(null);
        return;
      }

      const payload = (await response.json()) as { profiles: Array<{ id: string }> };
      setHasExistingProfile(payload.profiles.length > 0);
    };

    void checkExistingProfile();
  }, []);

  const uploadedCountLabel = useMemo(() => `${uploadedImageUrls.length}/2 uploaded`, [uploadedImageUrls.length]);

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    if (files.length > 2) {
      setStatus("You can select at most 2 images.");
      event.target.value = "";
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      setStatus("Please select only image files.");
      event.target.value = "";
      return;
    }

    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setStatus("Each image must be 5MB or less.");
      event.target.value = "";
      return;
    }

    const supabase = createSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("You must be signed in to upload.");
      return;
    }

    setUploading(true);
    setStatus("Uploading images...");

    const profileId = draftProfileId;
    const uploadedPaths: string[] = [];

    try {
      const prefix = `${user.id}/${profileId}`;
      const { data: existingFiles } = await supabase.storage.from("profile-images").list(prefix, { limit: 100 });
      if (existingFiles && existingFiles.length > 0) {
        const existingPaths = existingFiles.map((item) => `${prefix}/${item.name}`);
        await supabase.storage.from("profile-images").remove(existingPaths);
      }

      const nextUrls: string[] = [];

      for (const file of files) {
        const extension = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${profileId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: false });

        if (error) {
          throw new Error(error.message);
        }

        uploadedPaths.push(path);
        const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
        nextUrls.push(data.publicUrl);
      }

      setUploadedImageUrls(nextUrls.slice(0, 2));
      setStatus(`Images uploaded (${nextUrls.length}/2).`);
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("profile-images").remove(uploadedPaths);
      }
      setUploadedImageUrls([]);
      setStatus(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onCreateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (uploadedImageUrls.length > 2) {
      setStatus("A profile can include at most 2 images.");
      return;
    }

    const profileId = draftProfileId;

    setIsCreating(true);
    setSuccess(false);

    const response = await fetch("/api/me/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        name: listingForm.name,
        age: Number(listingForm.age),
        city: listingForm.city,
        price: Number(listingForm.price),
        description: listingForm.description,
        imageUrls: uploadedImageUrls,
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
      setStatus(payload.error ?? "Unable to create profile.");
      setIsCreating(false);
      return;
    }

    setSuccess(true);
    setStatus("Submitted for verification.");
    setHasExistingProfile(true);
    setListingForm(INITIAL_FORM);
    setUploadedImageUrls([]);
    setDraftProfileId(crypto.randomUUID());
    setIsCreating(false);
  };

  if (hasExistingProfile) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Create Home Profile</h1>
          <Link href="/me" className="bw-button-muted">Back</Link>
        </div>
        <section className="bw-card space-y-3 p-6 md:p-8">
          <p className="text-sm text-amber-300">You already have a profile. Only one profile is allowed per account.</p>
          <Link href="/me" className="bw-button-muted inline-flex">Back to My Profiles</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create Home Profile</h1>
        <Link href="/me" className="bw-button-muted">Back</Link>
      </div>

      <section className="bw-card space-y-4 p-6 md:p-8">
        <p className="text-sm text-amber-300">Your profile will appear on home after admin verification.</p>
        <form className="space-y-3" onSubmit={onCreateListing}>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="bw-input" placeholder="Name" value={listingForm.name} onChange={(e) => setListingForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="bw-input" type="number" min={18} placeholder="Age" value={listingForm.age} onChange={(e) => setListingForm((p) => ({ ...p, age: e.target.value }))} required />
            <input className="bw-input" placeholder="City" value={listingForm.city} onChange={(e) => setListingForm((p) => ({ ...p, city: e.target.value }))} required />
            <input className="bw-input" type="number" min={0} placeholder="Price" value={listingForm.price} onChange={(e) => setListingForm((p) => ({ ...p, price: e.target.value }))} required />
            <input className="bw-input" placeholder="Height" value={listingForm.height} onChange={(e) => setListingForm((p) => ({ ...p, height: e.target.value }))} />
            <input className="bw-input" placeholder="Availability" value={listingForm.availability} onChange={(e) => setListingForm((p) => ({ ...p, availability: e.target.value }))} />
            <input className="bw-input" type="number" min={0} placeholder="Experience years" value={listingForm.experienceYears} onChange={(e) => setListingForm((p) => ({ ...p, experienceYears: e.target.value }))} />
            <input className="bw-input" type="number" min={0} max={5} step={0.1} placeholder="Rating" value={listingForm.rating} onChange={(e) => setListingForm((p) => ({ ...p, rating: e.target.value }))} />
            <input className="bw-input" placeholder="Languages (comma separated)" value={listingForm.languages} onChange={(e) => setListingForm((p) => ({ ...p, languages: e.target.value }))} />
          </div>
          <input className="bw-input" placeholder="Services (comma separated)" value={listingForm.services} onChange={(e) => setListingForm((p) => ({ ...p, services: e.target.value }))} />

          <div className="rounded-xl border border-line p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">Upload images</p>
              <span className="text-xs text-white/60">{uploadedCountLabel}</span>
            </div>
            <input ref={deviceFileInputRef} type="file" accept="image/*" multiple onChange={onFileSelected} className="hidden" disabled={uploading} />
            <input ref={cameraFileInputRef} type="file" accept="image/*" capture="environment" multiple onChange={onFileSelected} className="hidden" disabled={uploading} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="bw-button-muted" onClick={() => deviceFileInputRef.current?.click()} disabled={uploading}>Upload from gallery/files</button>
              <button type="button" className="bw-button-muted" onClick={() => cameraFileInputRef.current?.click()} disabled={uploading}>Take photo</button>
            </div>
            <p className="mt-2 text-xs text-white/60">You can upload up to 2 images. JPG/PNG/WebP up to 5MB each.</p>
          </div>

          <textarea className="bw-input min-h-28" placeholder="Description" value={listingForm.description} onChange={(e) => setListingForm((p) => ({ ...p, description: e.target.value }))} required />
          <div className="flex items-center gap-3">
            <button type="submit" className="bw-button" disabled={isCreating || uploading}>{isCreating ? "Submitting..." : "Submit for Verification"}</button>
            {success ? (
              <>
                <Link href="/" className="bw-button-muted">Go Home</Link>
                <Link href="/me" className="bw-button-muted">Back to My Profiles</Link>
              </>
            ) : null}
          </div>
          <p className="text-sm text-white/70">{status ?? ""}</p>
        </form>
      </section>
    </main>
  );
}

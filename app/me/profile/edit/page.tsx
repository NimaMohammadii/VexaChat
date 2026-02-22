"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

type ListingForm = {
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

type OwnedProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  price: number;
  description: string;
  imageUrl: string;
  images: string[];
  height: string;
  availability: string;
  experienceYears: number;
  rating: number;
  languages: string[];
  services: string[];
};

function splitCommaSeparated(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function joinCommaSeparated(value: string[] | null | undefined) {
  return Array.isArray(value) ? value.join(", ") : "";
}

export default function EditProfilePage() {
  const [profile, setProfile] = useState<OwnedProfile | null>(null);
  const [listingForm, setListingForm] = useState<ListingForm | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const deviceFileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/me/profiles", { cache: "no-store" }).catch(() => null);
      if (!response || !response.ok) {
        setStatus("Unable to load your profile.");
        setLoading(false);
        return;
      }

      const payload = (await response.json()) as { profiles: OwnedProfile[] };
      const first = payload.profiles[0];

      if (!first) {
        setStatus("No profile found. Create one first.");
        setLoading(false);
        return;
      }

      setProfile(first);
      setUploadedImageUrls(Array.isArray(first.images) ? first.images.slice(0, 2) : []);
      setListingForm({
        name: first.name,
        age: String(first.age),
        city: first.city,
        price: String(first.price),
        description: first.description,
        height: first.height,
        availability: first.availability,
        experienceYears: String(first.experienceYears),
        rating: String(first.rating),
        languages: joinCommaSeparated(first.languages),
        services: joinCommaSeparated(first.services)
      });
      setLoading(false);
    };

    void load();
  }, []);

  const uploadedCountLabel = useMemo(() => `${uploadedImageUrls.length}/2 uploaded`, [uploadedImageUrls.length]);

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!profile || files.length === 0) {
      return;
    }

    if (files.length > 2) {
      setStatus("You can select at most 2 images.");
      event.target.value = "";
      return;
    }

    const invalid = files.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      setStatus("Please upload image files only.");
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

    const prefix = `${user.id}/${profile.id}`;
    const uploadedPaths: string[] = [];

    try {
      const { data: existingFiles, error: listError } = await supabase.storage.from("profile-images").list(prefix, { limit: 100 });
      if (listError) {
        throw new Error(listError.message);
      }

      if (existingFiles && existingFiles.length > 0) {
        const existingPaths = existingFiles.map((item) => `${prefix}/${item.name}`);
        const { error: removeError } = await supabase.storage.from("profile-images").remove(existingPaths);
        if (removeError) {
          throw new Error(removeError.message);
        }
      }

      const nextUrls: string[] = [];
      for (const file of files) {
        const extension = file.name.split(".").pop() || "jpg";
        const path = `${prefix}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("profile-images").upload(path, file, { upsert: false, contentType: file.type });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        uploadedPaths.push(path);
        const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
        nextUrls.push(data.publicUrl);
      }

      setUploadedImageUrls(nextUrls.slice(0, 2));
      setStatus("Images uploaded.");
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("profile-images").remove(uploadedPaths);
      }
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile || !listingForm) {
      return;
    }

    if (uploadedImageUrls.length > 2) {
      setStatus("A profile can include at most 2 images.");
      return;
    }

    setSaving(true);
    setStatus(null);

    const response = await fetch(`/api/me/profiles/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      setStatus(payload.error ?? "Unable to update profile.");
      setSaving(false);
      return;
    }

    setStatus("Profile updated.");
    setSaving(false);
    window.setTimeout(() => {
      window.location.href = "/me";
    }, 500);
  };

  if (loading) {
    return <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10"><p className="text-sm text-white/70">Loading profile...</p></main>;
  }

  if (!listingForm || !profile) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl space-y-4 px-4 py-10">
        <p className="text-sm text-white/70">{status ?? "No profile found."}</p>
        <Link href="/me" className="bw-button-muted inline-flex">Back to /me</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Home Profile</h1>
        <Link href="/me" className="bw-button-muted">Back</Link>
      </div>

      <section className="bw-card space-y-4 p-6 md:p-8">
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <input className="bw-input" placeholder="Name" value={listingForm.name} onChange={(e) => setListingForm((p) => p ? ({ ...p, name: e.target.value }) : p)} required />
            <input className="bw-input" type="number" min={18} placeholder="Age" value={listingForm.age} onChange={(e) => setListingForm((p) => p ? ({ ...p, age: e.target.value }) : p)} required />
            <input className="bw-input" placeholder="City" value={listingForm.city} onChange={(e) => setListingForm((p) => p ? ({ ...p, city: e.target.value }) : p)} required />
            <input className="bw-input" type="number" min={0} placeholder="Price" value={listingForm.price} onChange={(e) => setListingForm((p) => p ? ({ ...p, price: e.target.value }) : p)} required />
            <input className="bw-input" placeholder="Height" value={listingForm.height} onChange={(e) => setListingForm((p) => p ? ({ ...p, height: e.target.value }) : p)} />
            <input className="bw-input" placeholder="Availability" value={listingForm.availability} onChange={(e) => setListingForm((p) => p ? ({ ...p, availability: e.target.value }) : p)} />
            <input className="bw-input" type="number" min={0} placeholder="Experience years" value={listingForm.experienceYears} onChange={(e) => setListingForm((p) => p ? ({ ...p, experienceYears: e.target.value }) : p)} />
            <input className="bw-input" type="number" min={0} max={5} step={0.1} placeholder="Rating" value={listingForm.rating} onChange={(e) => setListingForm((p) => p ? ({ ...p, rating: e.target.value }) : p)} />
            <input className="bw-input" placeholder="Languages (comma separated)" value={listingForm.languages} onChange={(e) => setListingForm((p) => p ? ({ ...p, languages: e.target.value }) : p)} />
          </div>
          <input className="bw-input" placeholder="Services (comma separated)" value={listingForm.services} onChange={(e) => setListingForm((p) => p ? ({ ...p, services: e.target.value }) : p)} />

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

          <textarea className="bw-input min-h-28" placeholder="Description" value={listingForm.description} onChange={(e) => setListingForm((p) => p ? ({ ...p, description: e.target.value }) : p)} required />
          <div className="flex items-center gap-3">
            <button type="submit" className="bw-button" disabled={saving || uploading}>{saving ? "Saving..." : "Update Profile"}</button>
            <Link href="/me" className="bw-button-muted">Cancel</Link>
          </div>
          <p className="text-sm text-white/70">{status ?? ""}</p>
        </form>
      </section>
    </main>
  );
}

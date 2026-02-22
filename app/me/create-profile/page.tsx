"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

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
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function CreateProfilePage() {
  const [listingForm, setListingForm] = useState<CreateListingForm>(INITIAL_FORM);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatus("Image must be 5MB or less.");
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
    setStatus("Uploading image...");

    const tempProfileId = crypto.randomUUID();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${tempProfileId}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: false });

    if (error) {
      setStatus(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
    setUploadedImageUrl(data.publicUrl);
    setStatus("Image uploaded.");
    setUploading(false);
  };

  const onCreateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setSuccess(false);

    const response = await fetch("/api/me/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: listingForm.name,
        age: Number(listingForm.age),
        city: listingForm.city,
        price: Number(listingForm.price),
        description: listingForm.description,
        imageUrl: imageMode === "url" ? listingForm.imageUrl : "",
        uploadedImageUrl: imageMode === "upload" ? uploadedImageUrl : "",
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
    setListingForm(INITIAL_FORM);
    setUploadedImageUrl("");
    setIsCreating(false);
  };

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
            <p className="mb-3 text-sm font-medium">Profile image</p>
            <div className="mb-3 flex gap-2">
              <button type="button" className={`rounded-lg border px-3 py-1.5 text-sm ${imageMode === "upload" ? "border-paper" : "border-line"}`} onClick={() => setImageMode("upload")}>Upload image</button>
              <button type="button" className={`rounded-lg border px-3 py-1.5 text-sm ${imageMode === "url" ? "border-paper" : "border-line"}`} onClick={() => setImageMode("url")}>Use image link</button>
            </div>
            {imageMode === "upload" ? (
              <input type="file" accept="image/*" capture="environment" onChange={onFileSelected} className="bw-input" disabled={uploading} />
            ) : (
              <input className="bw-input" placeholder="https://example.com/photo.jpg" value={listingForm.imageUrl} onChange={(e) => setListingForm((p) => ({ ...p, imageUrl: e.target.value }))} />
            )}
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

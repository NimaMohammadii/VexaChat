"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useState } from "react";
import { uploadProfileImage } from "@/lib/profile-image-upload";
import { createSupabaseClient } from "@/lib/supabase-client";
import { Profile } from "@/lib/types";

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const toIntOrNull = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const toNumOrNull = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function EditProfileForm({ profile, isAdminContext = false }: { profile: Profile; isAdminContext?: boolean }) {
  const safeProfile = {
    ...profile,
    age: profile.age ?? "",
    availability: profile.availability ?? "",
    city: profile.city ?? "",
    description: profile.description ?? "",
    experienceYears: profile.experienceYears ?? "",
    height: profile.height ?? "",
    images: profile.images ?? [],
    isTop: profile.isTop ?? false,
    languages: profile.languages ?? [],
    price: profile.price ?? "",
    rating: profile.rating ?? "",
    services: profile.services ?? [],
    verified: profile.verified ?? false
  };

  const [name, setName] = useState(safeProfile.name);
  const [age, setAge] = useState<number | "">(safeProfile.age);
  const [city, setCity] = useState(safeProfile.city);
  const [price, setPrice] = useState<number | "">(safeProfile.price);
  const [description, setDescription] = useState(safeProfile.description);
  const [images, setImages] = useState<string[]>(safeProfile.images);
  const [height, setHeight] = useState(safeProfile.height);
  const [languages, setLanguages] = useState(safeProfile.languages?.join(", ") ?? "");
  const [availability, setAvailability] = useState(safeProfile.availability);
  const [verified, setVerified] = useState(safeProfile.verified);
  const [isTop, setIsTop] = useState(safeProfile.isTop);
  const [experienceYears, setExperienceYears] = useState<number | "">(safeProfile.experienceYears);
  const [rating, setRating] = useState<number | "">(safeProfile.rating);
  const [services, setServices] = useState(safeProfile.services?.join(", ") ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);

  async function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;

    setStatus(null);
    setIsUploading(true);

    try {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error || !user) {
        throw new Error("Please sign in before uploading images.");
      }

      const uploadedImages = await Promise.all(
        Array.from(files).map((file) => uploadProfileImage({ supabase, file, userId: user.id }))
      );

      setImages((currentImages) => [...currentImages, ...uploadedImages]);
      setStatus(`${uploadedImages.length} image(s) uploaded.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to upload images. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function onRemoveImage(indexToRemove: number) {
    setImages((currentImages) => currentImages.filter((_, index) => index !== indexToRemove));
  }

  async function onSave() {
    const endpoint = isAdminContext ? `/api/admin/profiles/${safeProfile.id}` : `/api/profiles/${safeProfile.id}`;

    try {
      const payload: Record<string, unknown> = {
        name,
        city,
        description,
        images,
        height,
        languages: splitCommaSeparated(languages),
        availability,
        verified,
        is_top: isTop,
        services: splitCommaSeparated(services)
      };

      const ageVal = toIntOrNull(age);
      if (ageVal !== null) payload.age = ageVal;
      const experienceYearsVal = toIntOrNull(experienceYears);
      if (experienceYearsVal !== null) payload.experience_years = experienceYearsVal;
      const priceVal = toNumOrNull(price);
      if (priceVal !== null) payload.price = priceVal;
      const ratingVal = toNumOrNull(rating);
      if (ratingVal !== null) payload.rating = ratingVal;

      const response = await fetch(endpoint, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        setStatus("Unauthorized. Please log in again.");
        router.push("/admin-login");
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(payload?.error ?? "Unable to save profile.");
        return;
      }

      setStatus("Saved.");
      router.push(isAdminContext ? "/admin/profiles" : `/profile/${safeProfile.id}`);
      router.refresh();
    } catch {
      setStatus("Unable to save profile.");
    }
  }

  return <div className="space-y-4">{/* unchanged UI below */}
      <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm"><span>Name</span><input className="bw-input" value={name} onChange={(event) => setName(event.target.value)} /></label><label className="space-y-2 text-sm"><span>Age</span><input className="bw-input" type="number" min={18} value={age} onChange={(event) => setAge(event.target.value === "" ? "" : Number(event.target.value))} /></label></div>
      <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm"><span>City</span><input className="bw-input" value={city} onChange={(event) => setCity(event.target.value)} /></label><label className="space-y-2 text-sm"><span>Price (hourly)</span><input className="bw-input" type="number" min={0} value={price} onChange={(event) => setPrice(event.target.value === "" ? "" : Number(event.target.value))} /></label></div>
      <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm"><span>Height</span><input className="bw-input" value={height} onChange={(event) => setHeight(event.target.value)} /></label><label className="space-y-2 text-sm"><span>Availability</span><input className="bw-input" value={availability} onChange={(event) => setAvailability(event.target.value)} /></label></div>
      <label className="space-y-2 text-sm"><span>Description</span><textarea className="bw-input min-h-32" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <div className="space-y-3 text-sm"><span className="block">Images</span><input className="bw-input" type="file" accept="image/*" multiple onChange={onFilesSelected} />{isUploading ? <p className="text-xs text-white/60">Uploading images...</p> : null}{images.length ? <div className="grid gap-3 sm:grid-cols-2">{images.map((image, index) => <div key={`${image.slice(0, 20)}-${index}`} className="rounded-lg border border-line bg-black/30 p-3"><div className="relative h-32 w-full overflow-hidden rounded-md"><Image src={image} alt={`Uploaded preview ${index + 1}`} fill unoptimized className="object-cover" /></div><button type="button" className="bw-button-muted mt-3 w-full" onClick={() => onRemoveImage(index)}>Remove</button></div>)}</div> : <p className="text-xs text-white/60">No images uploaded yet.</p>}</div>
      {status ? <p className="text-sm text-white/70">{status}</p> : null}
      <div className="flex flex-wrap gap-3"><button type="button" className="bw-button" onClick={onSave}>Save</button><button type="button" className="bw-button-muted" onClick={() => router.push("/admin/profiles")}>Cancel</button></div>
    </div>;
}

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { Profile } from "@/lib/types";

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function EditProfileForm({
  profile,
  isAdminContext = false
}: {
  profile: Profile;
  isAdminContext?: boolean;
}) {
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
    rating: profile.rating ?? 0,
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
  const [rating, setRating] = useState(safeProfile.rating);
  const [services, setServices] = useState(safeProfile.services?.join(", ") ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  async function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (!files?.length) {
      return;
    }

    setStatus(null);
    setIsUploading(true);

    try {
      const uploadedImages = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();

              reader.onload = () => {
                if (typeof reader.result === "string") {
                  resolve(reader.result);
                  return;
                }

                reject(new Error("Invalid file data"));
              };

              reader.onerror = () => reject(reader.error ?? new Error("Unable to read image"));

              reader.readAsDataURL(file);
            })
        )
      );

      setImages((currentImages) => [...currentImages, ...uploadedImages]);
      setStatus(`${uploadedImages.length} image(s) added.`);
    } catch {
      setStatus("Unable to upload images. Please try again.");
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
      const payload = {
        name,
        age,
        city,
        price,
        description,
        images,
        height,
        languages: splitCommaSeparated(languages),
        availability,
        verified,
        isTop,
        experienceYears,
        rating,
        services: splitCommaSeparated(services)
      };

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
      router.push(isAdminContext ? "/admin/profiles" : `/profiles/${safeProfile.id}`);
      router.refresh();
    } catch {
      setStatus("Unable to save profile.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span>Name</span>
          <input className="bw-input" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="space-y-2 text-sm">
          <span>Age</span>
          <input
            className="bw-input"
            type="number"
            min={18}
            value={age}
            onChange={(event) => setAge(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span>City</span>
          <input className="bw-input" value={city} onChange={(event) => setCity(event.target.value)} />
        </label>
        <label className="space-y-2 text-sm">
          <span>Price (hourly)</span>
          <input
            className="bw-input"
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span>Height</span>
          <input className="bw-input" value={height} onChange={(event) => setHeight(event.target.value)} />
        </label>
        <label className="space-y-2 text-sm">
          <span>Availability</span>
          <input className="bw-input" value={availability} onChange={(event) => setAvailability(event.target.value)} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span>Experience (years)</span>
          <input
            className="bw-input"
            type="number"
            min={0}
            value={experienceYears}
            onChange={(event) => setExperienceYears(Number(event.target.value))}
          />
        </label>
        <label className="space-y-2 text-sm">
          <span>Rating</span>
          <input
            className="bw-input"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-white"
            checked={verified}
            onChange={(event) => setVerified(event.target.checked)}
          />
          <span>Verified profile</span>
        </label>

        <label className="flex items-center justify-between rounded-xl border border-line bg-black/30 px-4 py-3 text-sm">
          <span>Top Profile</span>
          <span className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isTop}
              onChange={(event) => setIsTop(event.target.checked)}
            />
            <span className="h-6 w-11 rounded-full border border-white/20 bg-white/10 transition peer-checked:border-violet-300/70 peer-checked:bg-violet-500/25" />
            <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-[0_0_10px_rgba(168,85,247,0.35)] transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      <label className="space-y-2 text-sm">
        <span>Languages (comma separated)</span>
        <input className="bw-input" value={languages} onChange={(event) => setLanguages(event.target.value)} />
      </label>

      <label className="space-y-2 text-sm">
        <span>Services (comma separated)</span>
        <input className="bw-input" value={services} onChange={(event) => setServices(event.target.value)} />
      </label>

      <label className="space-y-2 text-sm">
        <span>Description</span>
        <textarea
          className="bw-input min-h-32"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div className="space-y-3 text-sm">
        <span className="block">Images</span>

        <input className="bw-input" type="file" accept="image/*" multiple onChange={onFilesSelected} />

        {isUploading ? <p className="text-xs text-white/60">Uploading images...</p> : null}

        {images.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((image, index) => (
              <div key={`${image.slice(0, 20)}-${index}`} className="rounded-lg border border-line bg-black/30 p-3">
                <div className="relative h-32 w-full overflow-hidden rounded-md">
                  <Image
                    src={image}
                    alt={`Uploaded preview ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <button type="button" className="bw-button-muted mt-3 w-full" onClick={() => onRemoveImage(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/60">No images uploaded yet.</p>
        )}
      </div>

      {status ? <p className="text-sm text-white/70">{status}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="bw-button" onClick={onSave}>
          Save
        </button>
        <button type="button" className="bw-button-muted" onClick={() => router.push("/admin/profiles")}>
          Cancel
        </button>
      </div>
    </div>
  );
}

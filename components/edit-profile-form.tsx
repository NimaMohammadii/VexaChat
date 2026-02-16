"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { Profile } from "@/lib/types";

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [city, setCity] = useState(profile.city);
  const [price, setPrice] = useState(profile.price);
  const [description, setDescription] = useState(profile.description);
  const [images, setImages] = useState(profile.images);
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
    const response = await fetch(`/api/profiles/${profile.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        age,
        city,
        price,
        description,
        images
      })
    });

    if (!response.ok) {
      setStatus("Unable to save profile.");
      return;
    }

    setStatus("Saved.");
    router.push("/admin/profiles");
    router.refresh();
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
            value={price}
            onChange={(event) => setPrice(Number(event.target.value))}
          />
        </label>
      </div>

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

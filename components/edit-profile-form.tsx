"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Profile } from "@/lib/types";

export function EditProfileForm({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [city, setCity] = useState(profile.city);
  const [price, setPrice] = useState(profile.price);
  const [description, setDescription] = useState(profile.description);
  const [services, setServices] = useState(profile.services.join(", "));
  const [images, setImages] = useState(profile.images.join(", "));
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

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
        services: services.split(",").map((service) => service.trim()).filter(Boolean),
        images: images.split(",").map((image) => image.trim()).filter(Boolean)
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
          <span>Price</span>
          <input className="bw-input" value={price} onChange={(event) => setPrice(event.target.value)} />
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

      <label className="space-y-2 text-sm">
        <span>Services (comma separated)</span>
        <input className="bw-input" value={services} onChange={(event) => setServices(event.target.value)} />
      </label>

      <label className="space-y-2 text-sm">
        <span>Image upload URLs (comma separated)</span>
        <input className="bw-input" value={images} onChange={(event) => setImages(event.target.value)} />
      </label>

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

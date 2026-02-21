"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { uploadProfileImage } from "@/lib/profile-image-upload";

type ProfilePageClientProps = {
  userId: string;
  initialImageUrl: string | null;
  initialName?: string;
};

export function ProfilePageClient({ userId, initialImageUrl, initialName = "" }: ProfilePageClientProps) {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = useMemo(() => createSupabaseClient(), []);

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setIsUploadingImage(true);
    setErrorMessage(null);
    setMessage(null);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user || user.id !== userId) {
        throw new Error("You must be logged in as the profile owner to upload an image.");
      }

      const publicUrl = await uploadProfileImage({ supabase, file: selectedFile, userId });
      setImageUrl(publicUrl);
      setMessage("Image uploaded successfully.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/profiles/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city,
          description,
          images: imageUrl ? [imageUrl] : [],
          availability: "Available"
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to publish listing.");
      }

      setMessage("Listing saved successfully.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to publish listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#222] bg-[#050505] p-6 md:p-7">
      <h2 className="text-lg font-semibold text-white">Create Your Listing</h2>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white" />
        <input required value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" className="w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white" />
        <textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="min-h-28 w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white" />

        <input type="file" accept="image/*" onChange={handleImageSelect} disabled={isUploadingImage} className="w-full cursor-pointer rounded-xl border border-[#333] bg-black px-3 py-2 text-sm text-white" />

        {imageUrl ? (
          <div className="relative h-64 w-full overflow-hidden rounded-xl border border-[#333]">
            <Image src={imageUrl} alt="Profile upload" fill className="object-cover" unoptimized />
          </div>
        ) : null}

        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
        {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}

        <button type="submit" disabled={isSubmitting || isUploadingImage} className="rounded-xl border border-white px-4 py-2 text-sm text-white">
          {isSubmitting ? "Saving..." : "Save listing"}
        </button>
      </form>
    </section>
  );
}

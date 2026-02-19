"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { uploadProfileImage } from "@/lib/profile-image-upload";

type ProfilePageClientProps = {
  userId: string;
  initialImageUrl: string | null;
};

export function ProfilePageClient({ userId, initialImageUrl }: ProfilePageClientProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl);

  const supabase = useMemo(() => createSupabaseClient(), []);

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setIsUploadingImage(true);
    setErrorMessage(null);
    setMessage(null);

    const objectPreview = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectPreview);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to upload an image.");
      }

      if (user.id !== userId) {
        throw new Error("You can only upload your own profile image.");
      }

      const publicUrl = await uploadProfileImage({
        supabase,
        file: selectedFile,
        userId,
        previousImageUrl: imageUrl || null
      });

      setImageUrl(publicUrl);
      setPreviewUrl(publicUrl);
      setMessage("Image uploaded successfully.");
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Failed to upload image.";
      setErrorMessage(nextError);
      setPreviewUrl(imageUrl || initialImageUrl || null);
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
      URL.revokeObjectURL(objectPreview);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const { error } = await supabase.from("listings").insert({
        user_id: userId,
        name,
        city,
        description,
        image_url: imageUrl,
        verified: false
      });

      if (error) {
        throw error;
      }

      setName("");
      setCity("");
      setDescription("");
      setMessage("Listing published successfully.");
    } catch (error) {
  console.error("SUPABASE INSERT ERROR:", error);
  const nextError = error instanceof Error ? error.message : "Failed to publish listing.";
  setErrorMessage(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#222] bg-[#050505] p-6 md:p-7">
      <h2 className="text-lg font-semibold text-white">Create Your Listing</h2>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          className="w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white outline-none transition-all duration-200 focus:border-white hover:border-white/60"
        />
        <input
          required
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="City"
          className="w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white outline-none transition-all duration-200 focus:border-white hover:border-white/60"
        />
        <textarea
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          className="min-h-28 w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white outline-none transition-all duration-200 focus:border-white hover:border-white/60"
        />

        <div className="space-y-3 rounded-xl border border-[#333] bg-black/70 p-4 transition-all duration-200 hover:border-white/60">
          <p className="text-sm text-white">Profile image</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            disabled={isUploadingImage}
            className="w-full cursor-pointer rounded-xl border border-[#333] bg-black px-3 py-2 text-sm text-white file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-white file:bg-black file:px-3 file:py-1.5 file:text-sm file:text-white file:transition file:hover:bg-white file:hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
          />

          {isUploadingImage ? <p className="text-xs text-white/70">Uploading image...</p> : null}

          {previewUrl ? (
            <div className="relative h-44 w-full overflow-hidden rounded-xl border border-[#333] bg-[#0a0a0a]">
              <Image src={previewUrl} alt="Profile preview" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <p className="text-xs text-white/60">No image selected yet.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isUploadingImage || !imageUrl}
          className="inline-flex items-center justify-center rounded-xl border border-white px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white hover:text-black disabled:opacity-70"
        >
          {isSubmitting ? "Publishing..." : "Publish Listing"}
        </button>

        {message ? <p className="text-sm text-white">{message}</p> : null}
        {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
      </form>
    </section>
  );
}

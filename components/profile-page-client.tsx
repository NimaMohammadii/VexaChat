"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";
import { uploadProfileImage } from "@/lib/profile-image-upload";
import { createSupabaseClient } from "@/lib/supabase-client";

type ProfilePageClientProps = {
  userId: string;
};

export function ProfilePageClient({ userId }: ProfilePageClientProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);
    setIsUploadingImage(true);

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const supabase = createSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to upload an image.");
      }

      if (user.id !== userId) {
        throw new Error("You can only upload an image for your own profile.");
      }

      const { publicUrl } = await uploadProfileImage({
        supabase,
        userId,
        file,
        previousPublicUrl: imageUrl || undefined,
      });

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ image_url: publicUrl })
        .eq("id", user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      URL.revokeObjectURL(localPreview);
      setPreviewUrl(publicUrl);
      setImageUrl(publicUrl);
    } catch (error) {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(imageUrl);
      const nextError =
        error instanceof Error ? error.message : "Failed to upload image.";
      setErrorMessage(nextError);
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
      const supabase = createSupabaseClient();
      if (!imageUrl) {
        throw new Error("Please upload a profile image before publishing.");
      }

      const { error } = await supabase.from("listings").insert({
        user_id: userId,
        name,
        city,
        description,
        image_url: imageUrl,
        verified: false,
      });

      if (error) {
        throw error;
      }

      setName("");
      setCity("");
      setDescription("");
      setImageUrl("");
      setPreviewUrl("");
      setMessage("Listing published successfully.");
    } catch (error) {
      const nextError =
        error instanceof Error ? error.message : "Failed to publish listing.";
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
          className="w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white outline-none focus:border-white"
        />
        <input
          required
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="City"
          className="w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white outline-none focus:border-white"
        />
        <textarea
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          className="min-h-28 w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white outline-none focus:border-white"
        />
        <label className="group block cursor-pointer rounded-xl border border-[#333] bg-black p-4 transition hover:border-white">
          <span className="mb-2 block text-xs uppercase tracking-wide text-white/70">
            Profile Image
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full text-sm text-white file:mr-3 file:rounded-lg file:border file:border-white file:bg-black file:px-3 file:py-2 file:text-white file:transition file:hover:bg-white file:hover:text-black"
          />
          {isUploadingImage ? (
            <p className="mt-2 text-xs text-white/70">Uploading image...</p>
          ) : null}
        </label>

        {previewUrl || imageUrl ? (
          <div className="overflow-hidden rounded-xl border border-[#333] bg-black/50 p-3">
            <div className="relative h-48 w-full overflow-hidden rounded-lg">
              <Image
                src={previewUrl || imageUrl}
                alt="Profile preview"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || isUploadingImage}
          className="inline-flex items-center justify-center rounded-xl border border-white px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:opacity-70"
        >
          {isSubmitting ? "Publishing..." : "Publish Listing"}
        </button>

        {message ? <p className="text-sm text-white">{message}</p> : null}
        {errorMessage ? (
          <p className="text-sm text-red-400">{errorMessage}</p>
        ) : null}
      </form>
    </section>
  );
}

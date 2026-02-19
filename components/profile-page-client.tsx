"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";

type ProfilePageClientProps = {
  userId: string;
};

export function ProfilePageClient({ userId }: ProfilePageClientProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!imageUrl) {
      setErrorMessage("Please upload an image.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const supabase = createSupabaseClient();
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
      setImageUrl("");
      setSelectedFileName(null);
      setMessage("Listing published successfully.");
    } catch (error) {
      const nextError = error instanceof Error ? error.message : "Failed to publish listing.";
      setErrorMessage(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImageUrl("");
      setSelectedFileName(null);
      return;
    }

    setIsReadingImage(true);
    setErrorMessage(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Unable to process image."));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = () => reject(reader.error ?? new Error("Unable to process image."));
        reader.readAsDataURL(file);
      });

      setImageUrl(dataUrl);
      setSelectedFileName(file.name);
    } catch (error) {
      setImageUrl("");
      setSelectedFileName(null);
      const nextError = error instanceof Error ? error.message : "Unable to process image.";
      setErrorMessage(nextError);
    } finally {
      setIsReadingImage(false);
      event.target.value = "";
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
        <label className="block space-y-2">
          <span className="text-sm text-white/80">Profile image</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onImageSelected}
            className="w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-black"
          />
          {isReadingImage ? <p className="text-xs text-white/60">Processing image…</p> : null}
          {selectedFileName ? <p className="text-xs text-white/60">Selected: {selectedFileName}</p> : null}
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-xl border border-white px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black disabled:opacity-70"
        >
          {isSubmitting ? "Publishing..." : "Publish Listing"}
        </button>

        {message ? <p className="text-sm text-white">{message}</p> : null}
        {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
      </form>
    </section>
  );
}

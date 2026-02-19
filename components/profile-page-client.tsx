"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase-client";

type ProfilePageClientProps = {
  userId: string;
};

export function ProfilePageClient({ userId }: ProfilePageClientProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      setImageUrl("");
      setMessage("Listing published successfully.");
    } catch (error) {
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
        <input
          required
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          placeholder="Image URL"
          className="w-full rounded-xl border border-[#333] bg-black px-4 py-3 text-sm text-white outline-none focus:border-white"
        />

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

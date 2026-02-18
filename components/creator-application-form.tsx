"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreatorApplicationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/creator-applications", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "Unable to submit application.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 bw-card p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creator Application</h1>
        <p className="mt-2 text-sm text-gray-400">Apply to join our approved creator directory.</p>
      </div>
      <label className="block space-y-2">
        <span className="text-sm text-gray-300">Display Name</span>
        <input name="displayName" required className="bw-input" maxLength={60} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-gray-300">Bio</span>
        <textarea name="bio" required className="bw-input min-h-28" maxLength={1000} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-gray-300">Monthly Price (USD)</span>
        <input name="price" type="number" min={1} required className="bw-input" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-gray-300">City</span>
        <input name="city" required className="bw-input" maxLength={80} />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-gray-300">Profile Image</span>
        <input name="profileImage" type="file" required accept="image/png,image/jpeg,image/webp" className="bw-input file:mr-4 file:border-0 file:bg-white file:px-3 file:py-1 file:text-black" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-gray-300">ID Card Image</span>
        <input name="idCardImage" type="file" required accept="image/png,image/jpeg,image/webp" className="bw-input file:mr-4 file:border-0 file:bg-white file:px-3 file:py-1 file:text-black" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-gray-300">Selfie With ID</span>
        <input name="selfieWithIdImage" type="file" required accept="image/png,image/jpeg,image/webp" className="bw-input file:mr-4 file:border-0 file:bg-white file:px-3 file:py-1 file:text-black" />
      </label>
      {error ? <p className="text-sm text-gray-300">{error}</p> : null}
      <button type="submit" className="bw-button w-full" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
